import express from 'express';
import AccountController from '../app/controllers/AccountController.js';

const router = express.Router();

// GET /api/account
router.get('/', (req, res) => {
    async (req, res) => AccountController.index(req, res);
});

export default router;