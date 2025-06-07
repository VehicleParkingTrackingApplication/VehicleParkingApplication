import express from 'express';
import parkingAreaController from '../app/controllers/parkingAreaController.js';
import parkingVehicleController from '../app/controllers/parkingVehicleController.js'
import requireAuth from '../middleware/auth/requireAuth.js';


const router = express.Router();

// GET /api/parking/area
router.get('/area', requireAuth, parkingAreaController.getParkingAreaByBusiness);

// GET /api/parking/vehicle
router.get('/vehicle', requireAuth, parkingVehicleController.getParkingVehicleByParkingArea);

// router.get('/area', requireAuth, ParkingAreaController.getParkingAreaByBusiness);


// GET /api/parking
// router.get('/', verifyJWT, ParkingController.index);

export default router;
