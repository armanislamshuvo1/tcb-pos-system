const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Cashier routes
router.get('/presets', authenticateToken, discountController.getPresetDiscounts);

// Admin-only routes
router.get('/admin', authenticateToken, requireRole('admin'), discountController.getAllDiscounts);
router.post('/admin', authenticateToken, requireRole('admin'), discountController.createDiscount);
router.put('/admin/:id', authenticateToken, requireRole('admin'), discountController.updateDiscount);
router.delete('/admin/:id', authenticateToken, requireRole('admin'), discountController.deleteDiscount);

module.exports = router;
