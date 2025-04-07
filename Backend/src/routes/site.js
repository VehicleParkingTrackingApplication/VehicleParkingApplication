import express from 'express';
import siteController from '../app/controllers/SiteController.js';

const router = express.Router();
// router.use(':slug', NewsController.show);
router.get('/login', siteController.login);
router.get('/register', siteController.register);
router.get('/search', siteController.search);
router.get('/', siteController.index);

export default router;