import express from 'express';
import authController from '../app/controllers/authController.js';

const router = express.Router();

// POST /api/auth/login 
// BODY: { username, password }
// RESPONSE: { message, accessToken }
router.post('/login', authController.login);

// POST /api/auth/register
// BODY: { username, password }
// RESPONSE: { message }
router.post('/register', authController.register);

// POST /api/auth/refresh
// RESPONSE { message, accessToken }
router.post('/refresh', authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

export default router;