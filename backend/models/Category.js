const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Category name is required'], 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    lowercase: true, 
    trim: true 
  },
  displayOrder: { 
    type: Number, 
    default: 0 
  },
  colorCode: { 
    type: String, 
    default: '#3B82F6' // Accent color for touch UI tiles
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

categorySchema.index({ companyId: 1, slug: 1 }, { unique: true });
categorySchema.index({ displayOrder: 1, isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
