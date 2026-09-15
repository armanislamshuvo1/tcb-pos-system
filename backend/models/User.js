const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firebaseUid: { 
    type: String, 
    unique: true, 
    sparse: true, 
    index: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  fullName: { 
    type: String, 
    required: [true, 'Full name is required'], 
    trim: true 
  },
  employeeCode: { 
    type: String, 
    required: [true, 'Employee code is required'], 
    uppercase: true, 
    trim: true,
    index: true 
  },
  role: { 
    type: String, 
    enum: ['system_admin', 'admin', 'cashier', 'staff'], 
    default: 'cashier',
    required: true 
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  pinCode: {
    type: String,
    default: '1234',
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ companyId: 1, employeeCode: 1 }, { unique: true });

// Pre-save hook: Hash PIN code using bcrypt if modified
userSchema.pre('save', async function () {
  if (!this.isModified('pinCode') || !this.pinCode) {
    return;
  }

  // Only hash if not already a bcrypt hash (starts with $2a$ or $2b$)
  if (!this.pinCode.startsWith('$2a$') && !this.pinCode.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.pinCode = await bcrypt.hash(this.pinCode, salt);
  }
});

// Compare entered candidate PIN against stored bcrypt hash
userSchema.methods.comparePin = async function (candidatePin) {
  if (!this.pinCode) return false;
  if (this.pinCode.startsWith('$2a$') || this.pinCode.startsWith('$2b$')) {
    return await bcrypt.compare(candidatePin, this.pinCode);
  }
  return this.pinCode === candidatePin;
};

module.exports = mongoose.model('User', userSchema);
