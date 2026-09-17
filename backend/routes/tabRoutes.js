const express = require('express');
const router = express.Router();
const tabController = require('../controllers/tabController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/consolidated', authenticateToken, tabController.getConsolidatedStaffTabs);
router.get('/all', authenticateToken, tabController.getAllUnpaidBills);
router.get('/by-product', authenticateToken, tabController.getUnpaidTabsByProduct);
router.get('/rooms', authenticateToken, tabController.getConsolidatedRoomTabs);
router.get('/rooms/:roomNumber/transactions', authenticateToken, tabController.getRoomOpenTransactions);
router.get('/customers', authenticateToken, tabController.getConsolidatedCustomerTabs);
router.get('/customers/:customerName/transactions', authenticateToken, tabController.getCustomerOpenTransactions);
router.get('/staff/:staffId/transactions', authenticateToken, tabController.getStaffOpenTransactions);
router.get('/settled', authenticateToken, tabController.getRecentlySettledBills);
router.post('/settle-transactions', authenticateToken, tabController.settleTransactions);
router.post('/revert-settlement', authenticateToken, tabController.revertSettlement);

module.exports = router;
