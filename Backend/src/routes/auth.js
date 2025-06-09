import express from 'express';
import auth from '../app/controllers/auth.js';

const router = express.Router();

// POST /api/auth/login 
// BODY: { username, password }
// RESPONSE: { message, accessToken }
router.post('/login', auth.login);

// POST /api/auth/register
// BODY: { username, password }
// RESPONSE: { message }
router.post('/register', auth.register);

// POST /api/auth/refresh
// RESPONSE { message, accessToken }
router.post('/refresh', auth.refresh);

// POST /api/auth/logout
router.post('/logout', auth.logout);

export default router;