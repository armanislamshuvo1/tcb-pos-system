const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Tenant Settings & Active Branding for Logged-In User
router.get('/my/current', authenticateToken, companyController.getMyCompany);
router.put('/my/settings', authenticateToken, requireRole('admin'), companyController.updateMyCompanySettings);

// B2B Multi-Tenant Company Management (System Admin Only)
router.get('/', authenticateToken, requireRole('system_admin'), companyController.getAllCompanies);
router.post('/', authenticateToken, requireRole('system_admin'), companyController.createCompany);
router.get('/:id', authenticateToken, requireRole('system_admin'), companyController.getCompanyById);
router.put('/:id', authenticateToken, requireRole('system_admin'), companyController.updateCompany);
router.post('/:id/admins', authenticateToken, requireRole('system_admin'), companyController.assignCompanyAdmin);

module.exports = router;
