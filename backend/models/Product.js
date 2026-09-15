const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { 
    type: String, 
    required: [true, 'SKU is required'], 
    uppercase: true, 
    trim: true 
  },
  name: { 
    type: String, 
    required: [true, 'Product name is required'], 
    trim: true 
  },
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: [true, 'Category reference is required'], 
    index: true 
  },
  categoryNameSnapshot: { 
    type: String, 
    required: true 
  },
  priceInCents: { 
    type: Number, 
    required: [true, 'Price in cents is required'], 
    min: [0, 'Price cannot be negative'] 
  },
  costInCents: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  taxRatePercent: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  stockQuantity: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  }
}, { timestamps: true });

productSchema.index({ companyId: 1, sku: 1 }, { unique: true });
productSchema.index({ name: 'text', sku: 'text', categoryNameSnapshot: 'text' });
productSchema.index({ categoryId: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
