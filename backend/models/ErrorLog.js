const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  level: { 
    type: String, 
    enum: ['error', 'warn', 'info'], 
    default: 'error' 
  },
  source: { 
    type: String, 
    default: 'backend_api' 
  },
  message: { 
    type: String, 
    required: true 
  },
  stack: { 
    type: String 
  },
  statusCode: { 
    type: Number, 
    default: 500 
  },
  meta: { 
    type: mongoose.Schema.Types.Mixed 
  },
  resolved: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// 30-day MongoDB TTL index
errorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
