const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');
const Customer = require('../models/Customer');
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
      tabType, // 'CUSTOMER', 'ROOM', 'STAFF', 'NONE'
      customerId,
      customerName,
      roomNumber,
      guestName,
      notes
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Cart must contain at least one item' });
    }

    // Resolve Customer if attached (scoped to current company)
    let resolvedCustomerId = null;
    let resolvedCustomerName = null;

    if (customerId) {
      const custFilter = { _id: customerId };
      if (req.user && req.user.role !== 'system_admin' && req.user.companyId) {
        custFilter.companyId = req.user.companyId;
      }
      const cust = await Customer.findOne(custFilter);
      if (cust) {
        resolvedCustomerId = cust._id;
        resolvedCustomerName = cust.name;
      }
    }
    if (!resolvedCustomerName && customerName && customerName.trim()) {
      resolvedCustomerName = customerName.trim();
    }

    // Resolve Staff Member if attached (scoped to current company)
    let staffNameSnapshot = null;
    let resolvedStaffMemberId = null;

    if (staffMemberId) {
      const staffFilter = { _id: staffMemberId };
      if (req.user && req.user.role !== 'system_admin' && req.user.companyId) {
        staffFilter.companyId = req.user.companyId;
      }
      const staff = await User.findOne(staffFilter);
      if (staff) {
        resolvedStaffMemberId = staff._id;
        staffNameSnapshot = staff.fullName;
      }
    }

    // Determine and validate tab type
    let resolvedTabType = 'NONE';
    let resolvedRoomNumber = roomNumber ? roomNumber.toUpperCase().trim() : undefined;
    let resolvedGuestName = guestName ? guestName.trim() : undefined;

    if (status === 'UNPAID_TAB') {
      if (tabType === 'CUSTOMER' || (resolvedCustomerName && !resolvedRoomNumber && !resolvedStaffMemberId)) {
        if (!resolvedCustomerName) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: 'A customer name is required to hold a Customer Bill'
          });
        }
        resolvedTabType = 'CUSTOMER';
        resolvedRoomNumber = undefined;
        resolvedGuestName = undefined;
        resolvedStaffMemberId = null;
        staffNameSnapshot = null;
      } else if (tabType === 'ROOM' || resolvedRoomNumber) {
        if (!resolvedRoomNumber || !resolvedRoomNumber.trim()) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: 'A Room Number must be selected to hold a Room Bill'
          });
        }
        resolvedTabType = 'ROOM';
        resolvedCustomerId = null;
        resolvedCustomerName = null;
        resolvedStaffMemberId = null;
        staffNameSnapshot = null;
      } else {
        if (!resolvedStaffMemberId) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: 'A customer, room, or staff member must be assigned to open an unpaid bill'
          });
        }
        resolvedTabType = 'STAFF';
        resolvedCustomerId = null;
        resolvedCustomerName = null;
        resolvedRoomNumber = undefined;
        resolvedGuestName = undefined;
      }
    } else {
      if (tabType === 'CUSTOMER' || (resolvedCustomerName && !resolvedRoomNumber && !resolvedStaffMemberId)) {
        resolvedTabType = 'CUSTOMER';
      } else if (tabType === 'ROOM' || resolvedRoomNumber) {
        resolvedTabType = 'ROOM';
      } else if (tabType === 'STAFF' || resolvedStaffMemberId) {
        resolvedTabType = 'STAFF';
      }
    }

    // Verify Products exist and belong to current company (or system catalog)
    const productIds = items.map((i) => i.productId).filter(Boolean);
    const prodFilter = { _id: { $in: productIds } };
    if (req.user && req.user.role !== 'system_admin' && req.user.companyId) {
      prodFilter.companyId = req.user.companyId;
    }
    const dbProducts = await Product.find(prodFilter).lean();
    const productMap = new Map();
    for (const p of dbProducts) {
      productMap.set(p._id.toString(), p);
    }

    // Enrich items with verified catalog data and categoryId
    const validatedItems = items.map((item) => {
      const dbProd = productMap.get(item.productId?.toString());
      return {
        ...item,
        productId: dbProd ? dbProd._id : item.productId,
        categoryId: dbProd?.categoryId ? (dbProd.categoryId._id || dbProd.categoryId) : (item.categoryId || undefined),
        productNameSnapshot: dbProd ? dbProd.name : (item.productNameSnapshot || item.name || 'Product'),
        skuSnapshot: dbProd ? dbProd.sku : (item.skuSnapshot || item.sku || 'SKU-NONE'),
        categoryNameSnapshot: dbProd ? (dbProd.categoryNameSnapshot || '') : (item.categoryNameSnapshot || ''),
        unitPriceInCents: dbProd ? dbProd.priceInCents : (Number(item.unitPriceInCents) || 0)
      };
    });

    // Calculate deterministic integer financials
    const financials = calculateCartFinancials({
      items: validatedItems,
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
      tabType: resolvedTabType,
      staffMemberId: resolvedStaffMemberId,
      staffNameSnapshot,
      customerId: resolvedCustomerId,
      customerName: resolvedCustomerName,
      roomNumber: resolvedRoomNumber,
      guestName: resolvedGuestName,
      items: financials.processedItems,
      subtotalInCents: financials.subtotalInCents,
      globalDiscountType: globalDiscount?.type || 'none',
      globalDiscountValue: Number(globalDiscount?.value) || 0,
      globalDiscountInCents: financials.globalDiscountInCents,
      totalDiscountInCents: financials.totalDiscountInCents,
      grandTotalInCents: financials.grandTotalInCents,
      paymentMethod: status === 'UNPAID_TAB' ? 'TAB_DEFERRED' : paymentMethod,
      settledAt: status === 'PAID' ? new Date() : undefined,
      companyId: req.user.companyId || null,
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

    // Real-time broadcast scoped to current company terminals
    broadcastUpdate('transaction_created', {
      id: transaction._id,
      txnNumber: transaction.txnNumber,
      status: transaction.status,
      grandTotalInCents: transaction.grandTotalInCents,
      staffMemberId: transaction.staffMemberId,
      customerId: transaction.customerId,
      customerName: transaction.customerName,
      createdAt: transaction.createdAt
    }, transaction.companyId);

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
      customerId,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};
    if (req.user && req.user.role !== 'system_admin' && req.user.companyId) {
      filter.companyId = req.user.companyId;
    }

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
    } else if (status !== 'UNPAID_TAB' && status !== 'VOIDED' && status !== 'ALL') {
      // Default to today's transactions unless querying unpaid tabs or specific filters
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

    if (customerId) {
      filter.customerId = customerId;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { txnNumber: searchRegex },
        { staffNameSnapshot: searchRegex },
        { cashierNameSnapshot: searchRegex },
        { voidedByStaffName: searchRegex },
        { voidReason: searchRegex },
        { customerName: searchRegex },
        { guestName: searchRegex },
        { roomNumber: searchRegex }
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
          totalVoidedInCents: {
            $sum: {
              $cond: [{ $eq: ['$status', 'VOIDED'] }, '$grandTotalInCents', 0]
            }
          },
          voidedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'VOIDED'] }, 1, 0]
            }
          },
          totalDiscountInCents: { $sum: '$totalDiscountInCents' }
        }
      }
    ]);

    const summary = aggregateTotals[0] || {
      totalRevenueInCents: 0,
      totalUnpaidInCents: 0,
      totalVoidedInCents: 0,
      voidedCount: 0,
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

// @desc    Get Transaction by ID or TXN Number
// @route   GET /api/transactions/:id
// @access  Authenticated
exports.getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filter = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      filter._id = id;
    } else {
      filter.txnNumber = id;
    }

    if (req.user && req.user.role !== 'system_admin' && req.user.companyId) {
      filter.companyId = req.user.companyId;
    }

    const transaction = await Transaction.findOne(filter).lean();
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Void / Cancel a transaction with PIN confirmation & cancellation reason
// @route   POST /api/transactions/:id/void
// @access  Authenticated
exports.voidTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pinCode, reason } = req.body;

    if (!pinCode || !pinCode.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'PIN confirmation is required to void a transaction'
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A reason is required to void or cancel a transaction'
      });
    }

    // Verify requesting staff member PIN
    const currentUser = await User.findById(req.user.mongoId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff user profile not found'
      });
    }

    const isPinValid = await currentUser.comparePin(pinCode.toString().trim());
    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN code. Transaction void rejected.'
      });
    }

    // Find transaction
    const filter = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      filter._id = id;
    } else {
      filter.txnNumber = id;
    }

    if (req.user && req.user.role !== 'system_admin' && req.user.companyId) {
      filter.companyId = req.user.companyId;
    }

    const transaction = await Transaction.findOne(filter);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status === 'VOIDED') {
      return res.status(400).json({
        success: false,
        message: `Transaction ${transaction.txnNumber} is already voided`
      });
    }

    // Apply void status and audit trail
    transaction.status = 'VOIDED';
    transaction.voidedAt = new Date();
    transaction.voidedByUserId = currentUser._id;
    transaction.voidedByStaffName = currentUser.fullName;
    transaction.voidReason = reason.trim();

    await transaction.save();

    // Broadcast SSE event scoped to company terminals
    broadcastUpdate('transaction_voided', {
      id: transaction._id,
      txnNumber: transaction.txnNumber,
      status: transaction.status,
      grandTotalInCents: transaction.grandTotalInCents,
      voidedByStaffName: transaction.voidedByStaffName,
      voidReason: transaction.voidReason,
      voidedAt: transaction.voidedAt
    }, transaction.companyId);

    res.status(200).json({
      success: true,
      data: transaction,
      message: `Transaction ${transaction.txnNumber} voided successfully by ${currentUser.fullName}`
    });
  } catch (error) {
    next(error);
  }
};

