const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Company code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  branding: {
    displayName: {
      type: String,
      default: 'PoS System',
      trim: true
    },
    logoText: {
      type: String,
      default: 'P',
      trim: true
    },
    themeColor: {
      type: String,
      default: '#F59E0B'
    }
  },
  currency: {
    code: {
      type: String,
      default: 'MYR',
      uppercase: true,
      trim: true
    },
    symbol: {
      type: String,
      default: 'RM',
      trim: true
    }
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  contactEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },
  contactPhone: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

companySchema.index({ code: 1, isActive: 1 });

module.exports = mongoose.model('Company', companySchema);
