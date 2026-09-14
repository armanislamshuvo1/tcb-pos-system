require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { addClient, broadcastUpdate } = require('./utils/sseBroadcaster');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const discountRoutes = require('./routes/discountRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const tabRoutes = require('./routes/tabRoutes');
const reportRoutes = require('./routes/reportRoutes');

const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Render, Heroku, Nginx) so express-rate-limit correctly identifies client IPs from X-Forwarded-For
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// CORS and Body Parser
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Server-Sent Events (SSE) Real-Time Updates Stream
app.get('/api/updates-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  addClient(res);

  // Initial heartbeat
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'SSE Stream Connected' })}\n\n`);
});

// API Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/users', userRoutes);
app.use('/api', userRoutes); // Mounts /api/staff and /api/admin/users/create
app.use('/api/transactions', transactionRoutes);
app.use('/api/tabs', tabRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

// Process-level unhandled exception guards
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection at Promise]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});

const server = app.listen(PORT, () => {
  console.log(`[Express API Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = { app, server };
