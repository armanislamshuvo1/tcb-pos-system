const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { broadcastUpdate } = require('../utils/sseBroadcaster');

// @desc    Get consolidated unpaid tabs (identical items grouped per staff with nested audit history)
// @route   GET /api/tabs/consolidated
// @access  Authenticated
exports.getConsolidatedStaffTabs = async (req, res, next) => {
  try {
    const { staffId } = req.query;
    const matchStage = { status: 'UNPAID_TAB' };
    
    if (staffId) {
      matchStage.staffMemberId = new mongoose.Types.ObjectId(staffId);
    }

    const consolidatedTabs = await Transaction.aggregate([
      { $match: matchStage },
      // Deconstruct individual line items
      { $unwind: '$items' },
      // Group by Staff + Product to consolidate identical items
      {
        $group: {
          _id: {
            staffMemberId: '$staffMemberId',
            staffName: '$staffNameSnapshot',
            productId: '$items.productId',
            productName: '$items.productNameSnapshot',
            categoryName: '$items.categoryNameSnapshot',
            unitPriceInCents: '$items.unitPriceInCents'
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalAmountInCents: { $sum: '$items.finalLineTotalInCents' },
          totalDiscountInCents: { $sum: '$items.lineDiscountInCents' },
          // Collect item-level occurrence history with specific transaction IDs
          history: {
            $push: {
              transactionId: '$_id',
              txnNumber: '$txnNumber',
              quantity: '$items.quantity',
              lineDiscountInCents: '$items.lineDiscountInCents',
              takenAt: '$items.takenAt',
              cashierName: '$cashierNameSnapshot'
            }
          }
        }
      },
      // Group back up to Staff Member level
      {
        $group: {
          _id: '$_id.staffMemberId',
          staffName: { $first: '$_id.staffName' },
          totalOwedInCents: { $sum: '$totalAmountInCents' },
          consolidatedItems: {
            $push: {
              productId: '$_id.productId',
              productName: '$_id.productName',
              categoryName: '$_id.categoryName',
              unitPriceInCents: '$_id.unitPriceInCents',
              totalQuantity: '$totalQuantity',
              totalAmountInCents: '$totalAmountInCents',
              totalDiscountInCents: '$totalDiscountInCents',
              history: '$history'
            }
          }
        }
      },
      { $sort: { totalOwedInCents: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: consolidatedTabs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get discrete open unpaid transactions for a specific staff member
// @route   GET /api/tabs/staff/:staffId/transactions
// @access  Authenticated
exports.getStaffOpenTransactions = async (req, res, next) => {
  try {
    const { staffId } = req.params;

    const openTransactions = await Transaction.find({
      staffMemberId: staffId,
      status: 'UNPAID_TAB'
    })
      .sort({ createdAt: -1 })
      .lean();

    const totalBalanceInCents = openTransactions.reduce((acc, t) => acc + t.grandTotalInCents, 0);

    res.status(200).json({
      success: true,
      data: {
        staffMemberId: staffId,
        staffName: openTransactions[0]?.staffNameSnapshot || 'Staff Member',
        totalBalanceInCents,
        transactionCount: openTransactions.length,
        transactions: openTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Settle specific whole transactions
// @route   POST /api/tabs/settle-transactions
// @access  Authenticated
exports.settleTransactions = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transactionIds, paymentMethod = 'CASH', notes } = req.body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'No transactions specified for settlement'
      });
    }

    if (!['CASH', 'CARD', 'PAYROLL_DEDUCTION'].includes(paymentMethod)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Payment method must be CASH, CARD, or PAYROLL_DEDUCTION'
      });
    }

    const settledAt = new Date();
    const cashierId = req.user.mongoId;
    const cashierNameSnapshot = req.user.fullName;

    // Verify all transactions exist and are UNPAID_TAB
    const pendingTxns = await Transaction.find({
      _id: { $in: transactionIds },
      status: 'UNPAID_TAB'
    }).session(session);

    if (pendingTxns.length !== transactionIds.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'One or more selected transactions are already settled or do not exist'
      });
    }

    // Atomic whole-transaction status update
    await Transaction.updateMany(
      { _id: { $in: transactionIds } },
      {
        $set: {
          status: 'PAID',
          paymentMethod,
          settledAt,
          settledByCashierId: cashierId,
          settledByCashierNameSnapshot: cashierNameSnapshot,
          notes: notes || undefined
        }
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Broadcast SSE update across all cashier terminals
    broadcastUpdate('tabs_settled', {
      transactionIds,
      settledAt,
      settledBy: cashierNameSnapshot,
      count: pendingTxns.length
    });

    res.status(200).json({
      success: true,
      data: {
        settledCount: pendingTxns.length,
        totalSettledInCents: pendingTxns.reduce((acc, t) => acc + t.grandTotalInCents, 0),
        settledAt,
        paymentMethod
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
