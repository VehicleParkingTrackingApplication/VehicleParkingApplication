import express from 'express';
import homeController from '../app/controllers/home.js';
const router = express.Router();

// GET api/home
router.get('/', homeController.index);

export default router;
