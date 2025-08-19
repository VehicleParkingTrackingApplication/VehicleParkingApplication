import express from 'express';
import staffController from '../app/controllers/staff.js';
import requireAuth from '../middleware/auth/require-auth.js';
import requireRole from '../middleware/auth/require-role.js';

const router = express.Router();

// GET /api/staff/list-staff
// QUERY: { businessId?, page?, limit? }
// Only admins can view staff list
router.get('/list-staff', requireAuth, requireRole('admin'), staffController.list);

// POST /api/staff/create-staff
// BODY: { username, password, firstName, lastName, email, businessId }
// Only admins can create staff accounts
router.post('/create-staff', requireAuth, requireRole('admin'), staffController.create);

// PUT /api/staff/update-staff
// BODY: { userId, username, firstName, lastName, email, businessId }
// Only admins can update staff accounts
router.put('/update-staff', requireAuth, requireRole('admin'), staffController.update);

// DELETE /api/staff/delete-staff
// BODY: { userId }
// Only admins can delete staff accounts
router.delete('/delete-staff', requireAuth, requireRole('admin'), staffController.remove);

export default router;