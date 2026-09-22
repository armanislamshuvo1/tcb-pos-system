const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Brute-force protection: Max 10 PIN login attempts per minute per IP
const pinLoginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many PIN login attempts from this terminal. Please wait 1 minute before trying again.'
  }
});

// Public PIN login route with rate limiting
router.post('/pin-login', pinLoginLimiter, userController.pinLogin);

// Authenticated user routes
router.get('/me', authenticateToken, userController.getCurrentUser);
router.get('/staff', authenticateToken, userController.getActiveStaff);

// Admin-only user provisioning, editing, listing & deletion
router.get('/admin/users', authenticateToken, requireRole('admin'), userController.getAllUsers);
router.post('/admin/create', authenticateToken, requireRole('admin'), userController.createUser);
router.put('/admin/users/:id', authenticateToken, requireRole('admin'), userController.updateUser);
router.delete('/admin/users/:id', authenticateToken, requireRole('admin'), userController.deleteUser);

module.exports = router;
