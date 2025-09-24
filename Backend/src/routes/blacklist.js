import express from 'express';
import BlacklistController from '../app/controllers/blacklist.js';
import requireAuth from '../middleware/auth/require-auth.js';
// import { requireRole } from '../middleware/auth/require-role.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Create blacklist entry
router.post('/', requireAuth, BlacklistController.createBlacklist);

// Get all blacklist entries by business ID
router.get('/business/:businessId', requireAuth, BlacklistController.getAllBlacklistByBusinessId);

// Search blacklist entries by plate number
router.get('/search', requireAuth, BlacklistController.searchBlacklistByPlateNumber);

// Check if a plate number is blacklisted (quick check)
router.get('/check', requireAuth, BlacklistController.checkBlacklistStatus);

export default router;
