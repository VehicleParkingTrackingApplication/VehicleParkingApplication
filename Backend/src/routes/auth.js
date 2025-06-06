import express from 'express';
import AuthController from '../app/controllers/AuthController.js';

const router = express.Router();

// GET /api/auth/login
router.get('/login', AuthController.login);

// POST /api/auth/login
router.post('/login', AuthController.loginPost);

// GET /api/auth/register
router.get('/register', AuthController.register);

// POST /api/auth/register
router.post('/register', AuthController.registerPost);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

export default router;