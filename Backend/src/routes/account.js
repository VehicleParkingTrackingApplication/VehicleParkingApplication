import express from 'express';
import AccountController from '../app/controllers/AccountController.js';
// import AuthController from '../app/controllers/AuthController.js';

const router = express.Router();

router.get('/login', AccountController.login);
router.post('/login', async (req, res) => AccountController.loginPost(req, res));
router.get('/register', AccountController.register);
router.post('/register', async (req, res) => AccountController.registerPost(req, res));
router.post('/logout', async (req, res) => AccountController.logout(req, res));

router.get('/', AccountController.index);

export default router;