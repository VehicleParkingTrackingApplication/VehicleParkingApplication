import express from 'express';
import HomeController from '../app/controllers/HomeController.js';

const router = express.Router();

// router.use(':slug', NewsController.show);
// router.get('/login', HomeController.login);
// router.post('/login', async (req, res) => HomeController.loginPost(req, res));
// router.post('/logout', async (req, res) => HomeController.logout(req, res));
// router.get('/register', HomeController.register);
// router.post('/register', async (req, res) =>
//   HomeController.registerPost(req, res),
// );
router.get('/import-data', async (req, res) =>
  HomeController.importData(req, res),
);
router.get('/import-business-data', async (req, res) =>
  HomeController.importBusinessData(req, res),
);
router.get('/import-parking-area-data', async (req, res) =>
  HomeController.importParkingAreaData(req, res),
);

router.get('/', HomeController.index);

export default router;
