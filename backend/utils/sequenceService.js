const Counter = require('../models/Counter');

/**
 * Generate an atomic, gapless sequential transaction ID
 * Example: TXN-2026-000001
 */
exports.getNextTransactionId = async (session = null) => {
  const currentYear = new Date().getFullYear();
  const counterId = `txn_${currentYear}`;

  const query = Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  if (session) {
    query.session(session);
  }

  const counter = await query.exec();
  const paddedSequence = String(counter.seq).padStart(6, '0');
  return `TXN-${currentYear}-${paddedSequence}`;
};
