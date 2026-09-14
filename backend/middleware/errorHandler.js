const ErrorLog = require('../models/ErrorLog');
const { broadcastUpdate } = require('../utils/sseBroadcaster');

const errorHandler = async (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  try {
    const errorEntry = await ErrorLog.create({
      level: statusCode >= 500 ? 'error' : 'warn',
      source: `${req.method} ${req.originalUrl}`,
      message,
      stack: err.stack,
      statusCode,
      meta: {
        body: req.body,
        query: req.query,
        params: req.params,
        user: req.user ? { id: req.user.mongoId, role: req.user.role } : null
      }
    });

    broadcastUpdate('error_log', {
      id: errorEntry._id,
      message: errorEntry.message,
      statusCode
    });
  } catch (logErr) {
    console.error('[ErrorLog Persistence Failure]', logErr.message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
