const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Cashier & Admin can browse products
router.get('/', authenticateToken, productController.getProducts);

// Admin-only product CRUD
router.post('/admin', authenticateToken, requireRole('admin'), productController.createProduct);
router.put('/admin/:id', authenticateToken, requireRole('admin'), productController.updateProduct);
router.delete('/admin/:id', authenticateToken, requireRole('admin'), productController.deleteProduct);

module.exports = router;
