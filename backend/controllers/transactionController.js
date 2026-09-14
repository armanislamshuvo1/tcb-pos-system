const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { getNextTransactionId } = require('../utils/sequenceService');
const { calculateCartFinancials } = require('../utils/discountEngine');
const { broadcastUpdate } = require('../utils/sseBroadcaster');
const mongoose = require('mongoose');

// In-memory idempotency cache for fast-paced checkouts (120s TTL)
const idempotencyCache = new Map();

// @desc    Create and finalize a transaction (PAID or UNPAID_TAB)
// @route   POST /api/transactions
// @access  Authenticated (Cashier, Admin)
exports.createTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const idempotencyKey = req.headers['x-idempotency-key'];
    if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json(idempotencyCache.get(idempotencyKey));
    }

    const {
      items,
      globalDiscount,
      status = 'PAID', // 'PAID' or 'UNPAID_TAB'
      paymentMethod = 'CASH', // 'CASH', 'CARD', 'TAB_DEFERRED'
      staffMemberId,
      notes
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Cart must contain at least one item' });
    }

    // Resolve Staff Member if attached
    let staffNameSnapshot = null;
    let resolvedStaffMemberId = null;

    if (staffMemberId) {
      const staff = await User.findById(staffMemberId);
      if (staff) {
        resolvedStaffMemberId = staff._id;
        staffNameSnapshot = staff.fullName;
      }
    }

    // Require staff member when opening an UNPAID_TAB
    if (status === 'UNPAID_TAB' && !resolvedStaffMemberId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'A staff member must be assigned to open an unpaid tab'
      });
    }

    // Calculate deterministic integer financials
    const financials = calculateCartFinancials({
      items,
      globalDiscount
    });

    // Generate atomic sequential transaction number (e.g., TXN-2026-000001)
    const txnNumber = await getNextTransactionId(session);

    const cashierId = req.user.mongoId;
    const cashierNameSnapshot = req.user.fullName;

    const [transaction] = await Transaction.create([{
      txnNumber,
      status,
      cashierId,
      cashierNameSnapshot,
      staffMemberId: resolvedStaffMemberId,
      staffNameSnapshot,
      items: financials.processedItems,
      subtotalInCents: financials.subtotalInCents,
      globalDiscountType: globalDiscount?.type || 'none',
      globalDiscountValue: Number(globalDiscount?.value) || 0,
      globalDiscountInCents: financials.globalDiscountInCents,
      grandTotalInCents: financials.grandTotalInCents,
      paymentMethod: status === 'UNPAID_TAB' ? 'TAB_DEFERRED' : paymentMethod,
      settledAt: status === 'PAID' ? new Date() : undefined,
      notes
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const responsePayload = {
      success: true,
      data: transaction
    };

    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, responsePayload);
      setTimeout(() => idempotencyCache.delete(idempotencyKey), 120000);
    }

    // Real-time broadcast for other POS terminals and tab screens
    broadcastUpdate('transaction_created', {
      id: transaction._id,
      txnNumber: transaction.txnNumber,
      status: transaction.status,
      grandTotalInCents: transaction.grandTotalInCents,
      staffMemberId: transaction.staffMemberId,
      createdAt: transaction.createdAt
    });

    res.status(201).json(responsePayload);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get Transaction Ledger (Default to today, with date filters and quick tab toggle)
// @route   GET /api/transactions/ledger
// @access  Authenticated
exports.getLedger = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      status, // 'PAID', 'UNPAID_TAB', 'ALL'
      cashierId,
      staffMemberId,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    // Date range filter: default to start of today local time if omitted
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    } else if (status !== 'UNPAID_TAB') {
      // Default to today's transactions unless querying unpaid tabs
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: todayStart };
    }

    // Status filter
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (cashierId) {
      filter.cashierId = cashierId;
    }

    if (staffMemberId) {
      filter.staffMemberId = staffMemberId;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { txnNumber: searchRegex },
        { staffNameSnapshot: searchRegex },
        { cashierNameSnapshot: searchRegex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments(filter)
    ]);

    // Financial totals for the query
    const aggregateTotals = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenueInCents: {
            $sum: {
              $cond: [{ $eq: ['$status', 'PAID'] }, '$grandTotalInCents', 0]
            }
          },
          totalUnpaidInCents: {
            $sum: {
              $cond: [{ $eq: ['$status', 'UNPAID_TAB'] }, '$grandTotalInCents', 0]
            }
          },
          totalDiscountInCents: { $sum: '$totalDiscountInCents' }
        }
      }
    ]);

    const summary = aggregateTotals[0] || {
      totalRevenueInCents: 0,
      totalUnpaidInCents: 0,
      totalDiscountInCents: 0
    };

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          totalCount,
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit))
        },
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};
