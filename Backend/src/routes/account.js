import express from 'express';
import accountController from '../app/controllers/account.js';
import requireAuth from '../middleware/auth/require-auth.js';
import requireRole from '../middleware/auth/require-role.js';

const router = express.Router();

// GET /api/account
router.get('/', requireAuth, accountController.index)

// Body: {email, phonenumber, businessName, location}
// POST /api/account/businessAccount
router.post('/input-business-account', requireAuth, accountController.inputBusiness);

// PUT /api/account/update-name
router.put('/update-name', requireAuth, accountController.updateName);

// GET /api/account/business-users - admins can see users in same businessId
router.get('/business-users', requireAuth, requireRole('admin'), accountController.listUsersInBusiness);

// Body: {email, phonenumber, businessName, location}
// PUT /api/account/businessAccount
// router.post('/updateBusinessAccount', (req, res) => {
//     account.updateBusinessAccount(req, res);
// })

export default router;