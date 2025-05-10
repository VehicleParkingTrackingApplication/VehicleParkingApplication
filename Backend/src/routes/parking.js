import express from 'express';
import parkingController from '../app/controllers/ParkingController.js';

const router = express.Router();

// router.get('/parking-vehicles', parkingController.getParkingVehicles);
// router.get('/parking-info', parkingController.getParkingInfo);
router.get('/register-new', parkingController.getRegisterParkingArea);
router.get('/', parkingController.index);

router.post('/registration-confirm', parkingController.postRegisterParkingArea);

export default router;
