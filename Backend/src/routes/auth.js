import express from 'express';
import authController from '../app/controllers/authController.js';

const router = express.Router();

// GET /api/auth/login
// router.get('/login', authController.login);

// POST /api/auth/login
router.post('/login', authController.loginPost);

// GET /api/auth/register
// router.get('/register', authController.register);

// POST /api/auth/register
router.post('/register', authController.registerPost);

// POST /api/auth/logout
router.post('/logout', authController.logout);

export default router;