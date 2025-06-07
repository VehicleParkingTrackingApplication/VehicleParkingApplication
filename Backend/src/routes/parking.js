import express from 'express';
import parkingAreaController from '../app/controllers/parkingAreaController.js';
import parkingVehicleController from '../app/controllers/parkingVehicleController.js'
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

// GET /api/parking/area
router.get('/area', verifyJWT, parkingAreaController.getParkingAreaByBusiness);

// GET /api/parking/vehicle
router.get('/vehicle', verifyJWT, parkingVehicleController.getParkingVehicleByParkingArea);

// GET /api/parking
// router.get('/', verifyJWT, ParkingController.index);

export default router;
