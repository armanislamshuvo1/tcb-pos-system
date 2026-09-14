const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/sales-summary', authenticateToken, requireRole('admin'), reportController.getSalesSummary);
router.get('/staff-consumption', authenticateToken, requireRole('admin'), reportController.getStaffConsumption);
router.get('/products', authenticateToken, requireRole('admin'), reportController.getProductReport);

module.exports = router;
