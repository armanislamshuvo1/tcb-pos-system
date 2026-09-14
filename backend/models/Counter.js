const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. 'txn_2026'
  seq: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Counter', counterSchema);
