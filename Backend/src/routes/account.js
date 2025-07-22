import express from 'express';
import accountController from '../app/controllers/account.js';


const router = express.Router();

// GET /api/account
router.get('/', (req, res) => {
    accountController.index(req, res);
});

// Body: {email, phonenumber, businessName, location}
// POST /api/account/businessAccount
router.post('/input-business-account', (req, res) => {  
    // res.json({"Check": "123"});
    accountController.inputBusiness(req, res);
});

// Body: {email, phonenumber, businessName, location}
// PUT /api/account/businessAccount
// router.post('/updateBusinessAccount', (req, res) => {
//     account.updateBusinessAccount(req, res);
// })

export default router;