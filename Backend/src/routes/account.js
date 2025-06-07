import express from 'express';
import accountController from '../app/controllers/accountController.js';

const router = express.Router();

// GET /api/account
router.get('/', (req, res) => {
    async (req, res) => accountController.index(req, res);
});

export default router;