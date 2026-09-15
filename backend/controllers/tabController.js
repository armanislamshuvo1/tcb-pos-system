const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { broadcastUpdate } = require('../utils/sseBroadcaster');

// @desc    Get consolidated unpaid tabs (identical items grouped per staff with nested audit history)
// @route   GET /api/tabs/consolidated
// @access  Authenticated
exports.getConsolidatedStaffTabs = async (req, res, next) => {
  try {
    const { staffId } = req.query;
    const matchStage = { 
      status: 'UNPAID_TAB',
      staffMemberId: { $ne: null, $exists: true },
      tabType: { $nin: ['ROOM', 'CUSTOMER'] },
      $or: [
        { roomNumber: { $exists: false } },
        { roomNumber: null },
        { roomNumber: '' }
      ]
    };
    
    if (req.user && req.user.role !== 'system_admin' && req.user.companyId) {
      matchStage.companyId = new mongoose.Types.ObjectId(req.user.companyId);
    }

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

    const query = {
      staffMemberId: staffId,
      status: 'UNPAID_TAB',
      tabType: { $nin: ['ROOM', 'CUSTOMER'] }
    };
    if (req.user && req.user.role !== 'system_admin' && req.user.companyId) {
      query.companyId = req.user.companyId;
    }

    const openTransactions = await Transaction.find(query)
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

    if (!['CASH', 'CARD', 'PAYROLL_DEDUCTION', 'TRANSFER', 'OTHER'].includes(paymentMethod)) {
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

// @desc    Get unpaid tabs grouped by product name with staff breakdown
// @route   GET /api/tabs/by-product
// @access  Authenticated
exports.getUnpaidTabsByProduct = async (req, res, next) => {
  try {
    const { search } = req.query;
    const matchStage = { 
      status: 'UNPAID_TAB',
      staffMemberId: { $ne: null, $exists: true },
      tabType: { $nin: ['ROOM', 'CUSTOMER'] },
      $or: [
        { roomNumber: { $exists: false } },
        { roomNumber: null },
        { roomNumber: '' }
      ]
    };

    if (req.user?.companyId && req.user.role !== 'system_admin') {
      matchStage.$or = [
        { companyId: new mongoose.Types.ObjectId(req.user.companyId) },
        { companyId: null }
      ];
    }

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$items' }
    ];

    if (search && search.trim()) {
      pipeline.push({
        $match: {
          'items.productNameSnapshot': {
            $regex: search.trim(),
            $options: 'i'
          }
        }
      });
    }

    pipeline.push(
      // Step 1: Group by Product Name + Staff Member
      {
        $group: {
          _id: {
            productName: '$items.productNameSnapshot',
            staffMemberId: '$staffMemberId',
            staffName: '$staffNameSnapshot'
          },
          productId: { $first: '$items.productId' },
          sku: { $first: '$items.skuSnapshot' },
          categoryName: { $first: '$items.categoryNameSnapshot' },
          unitPriceInCents: { $last: '$items.unitPriceInCents' },
          staffQuantity: { $sum: '$items.quantity' },
          staffAmountInCents: { $sum: '$items.finalLineTotalInCents' },
          staffDiscountInCents: { $sum: '$items.lineDiscountInCents' },
          occurrences: {
            $push: {
              transactionId: '$_id',
              txnNumber: '$txnNumber',
              quantity: '$items.quantity',
              unitPriceInCents: '$items.unitPriceInCents',
              finalLineTotalInCents: '$items.finalLineTotalInCents',
              lineDiscountInCents: '$items.lineDiscountInCents',
              takenAt: '$items.takenAt',
              cashierName: '$cashierNameSnapshot'
            }
          }
        }
      },
      // Step 2: Group by Product Name
      {
        $group: {
          _id: '$_id.productName',
          productId: { $first: '$productId' },
          sku: { $first: '$sku' },
          categoryName: { $first: '$categoryName' },
          unitPriceInCents: { $first: '$unitPriceInCents' },
          totalUnpaidQuantity: { $sum: '$staffQuantity' },
          totalUnpaidAmountInCents: { $sum: '$staffAmountInCents' },
          totalDiscountInCents: { $sum: '$staffDiscountInCents' },
          staffBreakdown: {
            $push: {
              staffMemberId: '$_id.staffMemberId',
              staffName: '$_id.staffName',
              quantity: '$staffQuantity',
              totalAmountInCents: '$staffAmountInCents',
              discountInCents: '$staffDiscountInCents',
              occurrences: '$occurrences'
            }
          }
        }
      },
      // Step 3: Project cleanly
      {
        $project: {
          _id: 0,
          productName: '$_id',
          productId: 1,
          sku: 1,
          categoryName: 1,
          unitPriceInCents: 1,
          totalUnpaidQuantity: 1,
          totalUnpaidAmountInCents: 1,
          totalDiscountInCents: 1,
          staffBreakdown: 1
        }
      },
      // Step 4: Sort by highest unpaid quantity first, then alphabetically
      {
        $sort: {
          totalUnpaidQuantity: -1,
          productName: 1
        }
      }
    );

    const results = await Transaction.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consolidated unpaid customer room bills
// @route   GET /api/tabs/rooms
// @access  Authenticated
exports.getConsolidatedRoomTabs = async (req, res, next) => {
  try {
    const { roomNumber, search } = req.query;
    const matchStage = { 
      status: 'UNPAID_TAB', 
      roomNumber: { $type: 'string', $nin: ['', null] },
      tabType: { $nin: ['STAFF', 'CUSTOMER'] }
    };

    if (req.user?.companyId && req.user.role !== 'system_admin') {
      matchStage.companyId = new mongoose.Types.ObjectId(req.user.companyId);
    }

    if (roomNumber) {
      matchStage.roomNumber = roomNumber.toUpperCase().trim();
    }

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$items' }
    ];

    if (search && search.trim()) {
      const term = search.trim();
      pipeline.push({
        $match: {
          $or: [
            { roomNumber: { $regex: term, $options: 'i' } },
            { guestName: { $regex: term, $options: 'i' } },
            { 'items.productNameSnapshot': { $regex: term, $options: 'i' } }
          ]
        }
      });
    }

    pipeline.push(
      // Step 1: Group by Room + Guest + Product
      {
        $group: {
          _id: {
            roomNumber: '$roomNumber',
            guestName: { $ifNull: ['$guestName', ''] },
            productId: '$items.productId',
            productName: '$items.productNameSnapshot',
            categoryName: '$items.categoryNameSnapshot',
            unitPriceInCents: '$items.unitPriceInCents'
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalAmountInCents: { $sum: '$items.finalLineTotalInCents' },
          totalDiscountInCents: { $sum: '$items.lineDiscountInCents' },
          history: {
            $push: {
              transactionId: '$_id',
              txnNumber: '$txnNumber',
              quantity: '$items.quantity',
              lineDiscountInCents: '$items.lineDiscountInCents',
              takenAt: '$items.takenAt',
              cashierName: '$cashierNameSnapshot',
              notes: '$notes'
            }
          }
        }
      },
      // Step 2: Group by Room + Guest
      {
        $group: {
          _id: {
            roomNumber: '$_id.roomNumber',
            guestName: '$_id.guestName'
          },
          totalOwedInCents: { $sum: '$totalAmountInCents' },
          itemCount: { $sum: '$totalQuantity' },
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
      // Step 3: Project
      {
        $project: {
          _id: 0,
          roomNumber: '$_id.roomNumber',
          guestName: '$_id.guestName',
          totalOwedInCents: 1,
          itemCount: 1,
          consolidatedItems: 1
        }
      },
      // Step 4: Sort by roomNumber ascending
      {
        $sort: { roomNumber: 1, guestName: 1 }
      }
    );

    const roomTabs = await Transaction.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: roomTabs.length,
      data: roomTabs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get discrete open transactions for a room
// @route   GET /api/tabs/rooms/:roomNumber/transactions
// @access  Authenticated
exports.getRoomOpenTransactions = async (req, res, next) => {
  try {
    const { roomNumber } = req.params;
    const { guestName } = req.query;

    const query = {
      roomNumber: roomNumber.toUpperCase().trim(),
      status: 'UNPAID_TAB',
      tabType: { $nin: ['STAFF', 'CUSTOMER'] }
    };

    if (req.user?.companyId && req.user.role !== 'system_admin') {
      query.companyId = req.user.companyId;
    }

    if (guestName !== undefined && guestName !== '') {
      query.guestName = guestName;
    } else if (guestName === '') {
      query.$or = [{ guestName: null }, { guestName: '' }, { guestName: { $exists: false } }];
    }

    const openTransactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const totalBalanceInCents = openTransactions.reduce((acc, t) => acc + t.grandTotalInCents, 0);

    res.status(200).json({
      success: true,
      data: {
        roomNumber: roomNumber.toUpperCase(),
        guestName: guestName || '',
        totalBalanceInCents,
        transactionCount: openTransactions.length,
        transactions: openTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consolidated unpaid customer bills/tabs
// @route   GET /api/tabs/customers
// @access  Authenticated
exports.getConsolidatedCustomerTabs = async (req, res, next) => {
  try {
    const { search, customerName } = req.query;
    const matchStage = {
      status: 'UNPAID_TAB',
      tabType: { $nin: ['ROOM', 'STAFF'] },
      $and: [
        {
          $or: [
            { roomNumber: { $exists: false } },
            { roomNumber: null },
            { roomNumber: '' }
          ]
        },
        {
          $or: [
            { customerName: { $type: 'string', $nin: ['', null] } },
            { customerId: { $ne: null, $exists: true } }
          ]
        }
      ]
    };

    if (req.user?.companyId && req.user.role !== 'system_admin') {
      matchStage.companyId = new mongoose.Types.ObjectId(req.user.companyId);
    }

    if (customerName) {
      matchStage.customerName = customerName.trim();
    }

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$items' }
    ];

    if (search && search.trim()) {
      const term = search.trim();
      pipeline.push({
        $match: {
          $or: [
            { customerName: { $regex: term, $options: 'i' } },
            { 'items.productNameSnapshot': { $regex: term, $options: 'i' } }
          ]
        }
      });
    }

    pipeline.push(
      // Group by Customer + Product
      {
        $group: {
          _id: {
            customerName: '$customerName',
            customerId: '$customerId',
            productId: '$items.productId',
            productName: '$items.productNameSnapshot',
            categoryName: '$items.categoryNameSnapshot',
            unitPriceInCents: '$items.unitPriceInCents'
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalAmountInCents: { $sum: '$items.finalLineTotalInCents' },
          totalDiscountInCents: { $sum: '$items.lineDiscountInCents' },
          history: {
            $push: {
              transactionId: '$_id',
              txnNumber: '$txnNumber',
              quantity: '$items.quantity',
              lineDiscountInCents: '$items.lineDiscountInCents',
              takenAt: '$items.takenAt',
              cashierName: '$cashierNameSnapshot',
              notes: '$notes'
            }
          }
        }
      },
      // Group by Customer
      {
        $group: {
          _id: {
            customerName: '$_id.customerName',
            customerId: '$_id.customerId'
          },
          totalOwedInCents: { $sum: '$totalAmountInCents' },
          itemCount: { $sum: '$totalQuantity' },
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
      // Project
      {
        $project: {
          _id: 0,
          customerName: '$_id.customerName',
          customerId: '$_id.customerId',
          totalOwedInCents: 1,
          itemCount: 1,
          consolidatedItems: 1
        }
      },
      {
        $sort: { totalOwedInCents: -1, customerName: 1 }
      }
    );

    const customerTabs = await Transaction.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: customerTabs.length,
      data: customerTabs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get discrete open transactions for a customer
// @route   GET /api/tabs/customers/:customerName/transactions
// @access  Authenticated
exports.getCustomerOpenTransactions = async (req, res, next) => {
  try {
    const { customerName } = req.params;
    const { customerId } = req.query;

    const query = {
      status: 'UNPAID_TAB',
      tabType: { $nin: ['ROOM', 'STAFF'] },
      $or: [
        { roomNumber: { $exists: false } },
        { roomNumber: null },
        { roomNumber: '' }
      ]
    };

    if (req.user?.companyId && req.user.role !== 'system_admin') {
      query.companyId = req.user.companyId;
    }

    const decodedCustomerName = decodeURIComponent(customerName).trim();
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      query.$and = [
        {
          $or: [
            { customerId: new mongoose.Types.ObjectId(customerId) },
            { customerName: decodedCustomerName }
          ]
        }
      ];
    } else {
      query.customerName = decodedCustomerName;
    }

    const openTransactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const totalBalanceInCents = openTransactions.reduce((acc, t) => acc + t.grandTotalInCents, 0);

    res.status(200).json({
      success: true,
      data: {
        customerName: decodeURIComponent(customerName).trim(),
        totalBalanceInCents,
        transactionCount: openTransactions.length,
        transactions: openTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};


