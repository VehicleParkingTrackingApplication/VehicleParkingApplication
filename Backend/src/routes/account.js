import express from 'express';
import AccountController from '../app/controllers/AccountController.js';
import AuthController from '../app/controllers/AuthController.js';

const router = express.Router();

router.get('/login', AuthController.login);
router.post('/login', async (req, res) => AuthController.loginPost(req, res));
router.get('/register', AuthController.register);
router.post('/register', async (req, res) => AuthController.registerPost(req, res));
router.post('/logout', async (req, res) => AuthController.logout(req, res));

router.get('/', AccountController.index);

export default router;