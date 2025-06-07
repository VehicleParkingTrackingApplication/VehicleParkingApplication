import express from 'express';
import ParkingAreaController from '../app/controllers/ParkingAreaController.js';
import ParkingVehicleController from '../app/controllers/ParkingVehicleController.js'
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

// GET /api/parking/area
router.get('/area', verifyJWT, ParkingAreaController.getParkingAreaByBusiness);

// GET /api/parking/vehicle
router.get('/vehicle', verifyJWT, ParkingVehicleController.getParkingVehicleByParkingArea);

// GET /api/parking
// router.get('/', verifyJWT, ParkingController.index);

export default router;
