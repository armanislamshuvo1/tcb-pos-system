const express = require('express');
const router = express.Router();
const tabController = require('../controllers/tabController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/consolidated', authenticateToken, tabController.getConsolidatedStaffTabs);
router.get('/staff/:staffId/transactions', authenticateToken, tabController.getStaffOpenTransactions);
router.post('/settle-transactions', authenticateToken, tabController.settleTransactions);

module.exports = router;
