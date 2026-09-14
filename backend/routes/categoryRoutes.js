const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public/Cashier authenticated routes
router.get('/', authenticateToken, categoryController.getCategories);

// Admin-only category management routes
router.post('/admin', authenticateToken, requireRole('admin'), categoryController.createCategory);
router.put('/admin/:id', authenticateToken, requireRole('admin'), categoryController.updateCategory);
router.delete('/admin/:id', authenticateToken, requireRole('admin'), categoryController.deleteCategory);

module.exports = router;
