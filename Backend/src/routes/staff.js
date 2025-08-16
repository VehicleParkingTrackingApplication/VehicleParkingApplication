import express from 'express';
import staffController from '../app/controllers/staff.js';
import requireAuth from '../middleware/auth/require-auth.js';

const router = express.Router();

// POST /api/staff/create
// BODY: { username, password }
router.post('/create', requireAuth, staffController.create);

export default router;