import express from 'express';
import AuthController from '../app/controllers/AuthController.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', AuthController.login);

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/refresh
router.post('/refresh', AuthController.refresh);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

export default router;