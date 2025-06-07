import express from 'express';
import ParkingAreaController from '../app/controllers/ParkingAreaController.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

// router.get('/parking-vehicles', parkingController.getParkingVehicles);
// router.get('/parking-info', parkingController.getParkingInfo);

// GET /api/parking/area
router.get('/area', verifyJWT, ParkingAreaController.getParkingAreaByBusiness);

// GET /api/parking
// router.get('/', verifyJWT, ParkingController.index);

export default router;
