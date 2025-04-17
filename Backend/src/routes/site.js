import express from 'express';
import siteController from '../app/controllers/SiteController.js';

const router = express.Router();
// router.use(':slug', NewsController.show);
router.get('/login', siteController.login);
router.post('/login', async (req, res) => siteController.loginPost(req, res));
router.get('/register', siteController.register);
router.post('/register', async (req, res) => siteController.registerPost(req, res));
// router.get('/search', siteController.search);
router.get('/import-data', async (req, res) => siteController.importData(req, res));
router.get('/', siteController.index);

export default router;