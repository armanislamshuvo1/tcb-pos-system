const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Discount name is required'], 
    trim: true 
  },
  type: { 
    type: String, 
    enum: ['percentage', 'fixed_cents'], 
    required: true 
  },
  target: { 
    type: String, 
    enum: ['line_item', 'global_ticket', 'specific_product'], 
    required: true 
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productNameSnapshot: {
    type: String
  },
  value: { 
    type: Number, 
    required: [true, 'Discount value is required'], 
    min: [0, 'Discount value cannot be negative'] 
  },
  isPresetButton: { 
    type: Boolean, 
    default: false 
  },
  displayOrder: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

discountSchema.index({ isPresetButton: 1, isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('Discount', discountSchema);
