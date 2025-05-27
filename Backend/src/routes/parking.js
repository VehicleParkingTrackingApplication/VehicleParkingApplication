import express from 'express';
import ParkingController from '../app/controllers/ParkingController.js';

const router = express.Router();

// router.get('/parking-vehicles', parkingController.getParkingVehicles);
// router.get('/parking-info', parkingController.getParkingInfo);
router.get('/parking-area', ParkingController.getParkingArea);
router.get('/', ParkingController.index);

export default router;
