const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Open GET and HEAD health checks
router.get('/', healthController.getHealthStatus);
router.head('/', healthController.getHealthStatus);

module.exports = router;
