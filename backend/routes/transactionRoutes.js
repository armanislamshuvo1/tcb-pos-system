const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, transactionController.createTransaction);
router.get('/ledger', authenticateToken, transactionController.getLedger);
router.post('/:id/void', authenticateToken, transactionController.voidTransaction);
router.get('/:id', authenticateToken, transactionController.getTransactionById);

module.exports = router;
