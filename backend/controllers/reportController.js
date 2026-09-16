const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Generate Sales & Revenue Summary Report
// @route   GET /api/reports/sales-summary
// @access  Admin Only
exports.getSalesSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = {};

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
    }

    const summary = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          paidTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] }
          },
          unpaidTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'UNPAID_TAB'] }, 1, 0] }
          },
          voidedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'VOIDED'] }, 1, 0] }
          },
          grossSubtotalInCents: {
            $sum: { $cond: [{ $ne: ['$status', 'VOIDED'] }, '$subtotalInCents', 0] }
          },
          totalDiscountInCents: {
            $sum: { $cond: [{ $ne: ['$status', 'VOIDED'] }, '$totalDiscountInCents', 0] }
          },
          netPaidRevenueInCents: {
            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$grandTotalInCents', 0] }
          },
          outstandingTabLiabilityInCents: {
            $sum: { $cond: [{ $eq: ['$status', 'UNPAID_TAB'] }, '$grandTotalInCents', 0] }
          },
          voidedAmountInCents: {
            $sum: { $cond: [{ $eq: ['$status', 'VOIDED'] }, '$grandTotalInCents', 0] }
          }
        }
      }
    ]);

    // Payment method distribution (excluding voided)
    const paymentBreakdown = await Transaction.aggregate([
      { $match: { ...matchStage, status: { $ne: 'VOIDED' } } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalInCents: { $sum: '$grandTotalInCents' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: summary[0] || {
          totalTransactions: 0,
          paidTransactions: 0,
          unpaidTransactions: 0,
          grossSubtotalInCents: 0,
          totalDiscountInCents: 0,
          netPaidRevenueInCents: 0,
          outstandingTabLiabilityInCents: 0
        },
        paymentBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Staff Consumption Report (filter by staff member, timeframe)
// @route   GET /api/reports/staff-consumption
// @access  Admin Only
exports.getStaffConsumption = async (req, res, next) => {
  try {
    const { staffId, startDate, endDate } = req.query;
    const matchStage = { staffMemberId: { $ne: null }, status: { $ne: 'VOIDED' } };

    if (staffId) {
      matchStage.staffMemberId = new mongoose.Types.ObjectId(staffId);
    }

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
    }

    const report = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$staffMemberId',
          staffName: { $first: '$staffNameSnapshot' },
          totalTransactions: { $sum: 1 },
          totalIncurredInCents: { $sum: '$grandTotalInCents' },
          totalPaidInCents: {
            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$grandTotalInCents', 0] }
          },
          totalUnpaidInCents: {
            $sum: { $cond: [{ $eq: ['$status', 'UNPAID_TAB'] }, '$grandTotalInCents', 0] }
          }
        }
      },
      { $sort: { totalUnpaidInCents: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Product Performance Report (Top items, volume, revenue)
// @route   GET /api/reports/products
// @access  Admin Only
exports.getProductReport = async (req, res, next) => {
  try {
    const { startDate, endDate, categoryId } = req.query;
    const matchStage = { status: { $ne: 'VOIDED' } };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
    }

    const report = await Transaction.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      ...(categoryId ? [{ $match: { 'items.categoryId': new mongoose.Types.ObjectId(categoryId) } }] : []),
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productNameSnapshot' },
          categoryName: { $first: '$items.categoryNameSnapshot' },
          sku: { $first: '$items.skuSnapshot' },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalGrossInCents: {
            $sum: { $multiply: ['$items.unitPriceInCents', '$items.quantity'] }
          },
          totalDiscountInCents: { $sum: '$items.lineDiscountInCents' },
          totalNetInCents: { $sum: '$items.finalLineTotalInCents' }
        }
      },
      { $sort: { totalQuantitySold: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};
