const express = require('express');
const router = express.Router();
const terminalController = require('../controllers/terminalController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public terminal discovery and binding check
router.get('/status', terminalController.getTerminalStatus);
router.get('/public-companies', terminalController.getPublicCompanies);

// Terminal pairing & unpairing
// authenticateToken is optional on bind/unbind because it can verify credentials via body
router.post('/bind', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authenticateToken(req, res, next);
  }
  next();
}, terminalController.bindTerminal);

router.post('/unbind', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authenticateToken(req, res, next);
  }
  next();
}, terminalController.unbindTerminal);

// Admin terminal listing
router.get('/list', authenticateToken, requireRole('admin'), terminalController.listTerminals);

module.exports = router;
