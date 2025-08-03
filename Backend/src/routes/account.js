import express from 'express';
import accountController from '../app/controllers/account.js';
import requireAuth from '../middleware/auth/require-auth.js';

const router = express.Router();

// GET /api/account
router.get('/', requireAuth, accountController.index)

// Body: {email, phonenumber, businessName, location}
// POST /api/account/businessAccount
router.post('/input-business-account', requireAuth, accountController.inputBusiness);

// Body: {email, phonenumber, businessName, location}
// PUT /api/account/businessAccount
// router.post('/updateBusinessAccount', (req, res) => {
//     account.updateBusinessAccount(req, res);
// })

export default router;