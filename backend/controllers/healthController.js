const mongoose = require('mongoose');
const packageJson = require('../package.json');

/**
 * Maps Mongoose readyState integer to human-readable string
 */
const getDatabaseState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Formats uptime seconds into a readable string (e.g., '1d 2h 3m 4s')
 */
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};

/**
 * Open health and status check handler
 * Returns HTTP 200 with operational metrics, DB connectivity, and runtime info.
 */
exports.getHealthStatus = (req, res) => {
  const dbState = getDatabaseState();
  const isDbHealthy = mongoose.connection.readyState === 1;
  const memory = process.memoryUsage();

  const healthData = {
    status: isDbHealthy ? 'healthy' : 'degraded',
    message: 'TCB PoS System API is operational',
    service: 'tcb-pos-backend',
    version: packageJson.version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    uptimeFormatted: formatUptime(process.uptime()),
    database: {
      status: dbState,
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((memory.rss / 1024 / 1024) * 100) / 100
      }
    }
  };

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).json({
    success: true,
    data: healthData
  });
};
