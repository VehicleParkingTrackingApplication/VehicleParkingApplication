import express from 'express';
import ParkingController from '../app/controllers/ParkingController.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

// router.get('/parking-vehicles', parkingController.getParkingVehicles);
// router.get('/parking-info', parkingController.getParkingInfo);

// GET /api/parkingAreaById
router.get('/parking-area', verifyJWT, ParkingController.getParkingArea);

// GET /api/parking
router.get('/', verifyJWT, ParkingController.index);

export default router;
