import express from 'express';
import area from '../app/controllers/area.js';
import vehicle from '../app/controllers/vehicle.js'
import requireAuth from '../middleware/auth/require-auth.js';


const router = express.Router();

// GET /api/parking/area
router.get('/area', requireAuth, area.getParkingAreaByBusiness);

// GET /api/parking/vehicle
router.get('/vehicle', requireAuth, vehicle.getParkingVehicleByParkingArea);

// POST /api/parking/simulate
router.post('/simulate', vehicle.handleSimulation);

// router.get('/area', requireAuth, ParkingAreaController.getParkingAreaByBusiness);


// GET /api/parking
// router.get('/', verifyJWT, ParkingController.index);

export default router;
