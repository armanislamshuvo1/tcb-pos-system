const mongoose = require('mongoose');

const terminalSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    default: 'Main Terminal',
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required'],
    index: true
  },
  boundBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  boundAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

terminalSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('Terminal', terminalSchema);
