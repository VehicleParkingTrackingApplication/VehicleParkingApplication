import express from 'express';
import parkingController from '../app/controllers/ParkingController.js';

const router = express.Router();


// router.get('/parking-vehicles', parkingController.getParkingVehicles);
// router.get('/parking-info', parkingController.getParkingInfo);
router.get('/', parkingController.index);
 
export default router;