import express from 'express';
import requireAuth from '../middleware/auth/require-auth.js';
import requireRole from '../middleware/auth/require-role.js';

const router = express.Router();

// Only admin can access this router
router.get('/admin', requireAuth, requireRole('admin'), (req, res) => {
    res.json({ message: 'Admin page' });
});

// Both admin and manager can access this router
router.get('/manager', requireAuth, requireRole('manager'), (req, res) => {
    res.send({ message: 'Manager page' });
});

// ALl can access this router
router.get('/user', requireAuth, requireRole('user'), (req, res) => {
    res.send({ message: 'User page' });
});

export default router;