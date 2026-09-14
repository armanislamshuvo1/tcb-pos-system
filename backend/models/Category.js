const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Category name is required'], 
    unique: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
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
  }
}, { timestamps: true });

categorySchema.index({ displayOrder: 1, isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
