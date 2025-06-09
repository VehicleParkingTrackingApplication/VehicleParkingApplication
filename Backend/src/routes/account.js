import express from 'express';
import account from '../app/controllers/account.js';

const router = express.Router();

// GET /api/account
router.get('/', (req, res) => {
    async (req, res) => account.index(req, res);
});

export default router;