const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  productNameSnapshot: { type: String, required: true },
  skuSnapshot: { type: String, required: true },
  categoryNameSnapshot: { type: String, default: '' },
  unitPriceInCents: { type: Number, required: true }, // Frozen point-in-time price
  quantity: { type: Number, required: true, min: 1 },
  
  // Line-Level Discount
  lineDiscountType: { 
    type: String, 
    enum: ['percentage', 'fixed_cents', 'none'], 
    default: 'none' 
  },
  lineDiscountValue: { type: Number, default: 0 },
  lineDiscountInCents: { type: Number, default: 0 },
  
  finalLineTotalInCents: { type: Number, required: true },
  takenAt: { type: Date, default: Date.now, required: true }
}, { _id: true });

const transactionSchema = new mongoose.Schema({
  txnNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  status: { 
    type: String, 
    enum: ['PAID', 'UNPAID_TAB', 'VOIDED'], 
    default: 'PAID', 
    index: true 
  },
  
  // Audited Cashier Attribution
  cashierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  cashierNameSnapshot: { type: String, required: true },
  
  // Tab Assignment (Staff Tab vs. Customer Room Bill)
  tabType: {
    type: String,
    enum: ['STAFF', 'ROOM', 'NONE'],
    default: 'NONE',
    index: true
  },
  staffMemberId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    index: true 
  },
  staffNameSnapshot: { type: String },

  // Customer Room Bill Assignment
  roomNumber: { 
    type: String, 
    index: true 
  },
  guestName: { 
    type: String 
  },

  items: [lineItemSchema],

  // Financial Computations
  subtotalInCents: { type: Number, required: true },
  globalDiscountType: { 
    type: String, 
    enum: ['percentage', 'fixed_cents', 'none'], 
    default: 'none' 
  },
  globalDiscountValue: { type: Number, default: 0 },
  globalDiscountInCents: { type: Number, default: 0 },
  grandTotalInCents: { type: Number, required: true },

  // Settlement Tracking (Whole Transaction Level)
  paymentMethod: { 
    type: String, 
    enum: ['CASH', 'CARD', 'TAB_DEFERRED', 'PAYROLL_DEDUCTION', 'TRANSFER', 'OTHER'], 
    required: true 
  },
  settledAt: { type: Date },
  settledByCashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  settledByCashierNameSnapshot: { type: String },
  
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  currency: {
    code: { type: String, default: 'MYR' },
    symbol: { type: String, default: 'RM' }
  },

  notes: { type: String }
}, { timestamps: true });

// Compound Indexes for Rapid Ledger Queries & Aggregations
transactionSchema.index({ createdAt: -1, status: 1 });
transactionSchema.index({ staffMemberId: 1, status: 1 });
transactionSchema.index({ roomNumber: 1, status: 1 });
transactionSchema.index({ createdAt: 1, cashierId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
