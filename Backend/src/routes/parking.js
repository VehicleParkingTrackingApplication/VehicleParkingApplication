import express from 'express';
import area from '../app/controllers/area.js';
import vehicle from '../app/controllers/vehicle.js'
import requireAuth from '../middleware/auth/require-auth.js';

const router = express.Router();


// GET /api/parking/area
router.get('/area', requireAuth, area.getAreaByBusiness);

// POST /api/parking/area/input-area
router.post('/area/input-area', requireAuth, area.inputParkingArea);

// POST /api/parking/area/input-ftpserver
router.post('/area/input-ftpserver', requireAuth, area.inputFtpServer);

// PUT /api/parking/area/update-ftpserver
router.put('/area/update-ftpserver', requireAuth, area.updateFtpServer);

// POST /api/parking/area/input-vehicle
router.post('/area/input-vehicle', requireAuth, vehicle.inputVehicleForm);

// GET /api/parking/vehicle/:areaId/existing-vehicles
router.get('/vehicle/:areaId/existing-vehicles', requireAuth, vehicle.getExistingParkingVehicleByParkingArea);

// GET /api/vehicle/:areaId/recent-records
router.get('/vehicle/:areaId/recent-records', requireAuth, vehicle.getRecentRecords);

// GET /api/parking/vehicle/:areaId/all-records
router.get('/vehicle/:areaId/all-records', requireAuth, vehicle.getAllRecordsByArea);

// POST /api/parking/vehicle/manually-input
router.post('/vehicle/manually-input', requireAuth, vehicle.inputVehicleForm);

// New routes for manual input workflow with areaId
// GET /api/parking/area/:areaId/details
// router.get('/area/:areaId/details', requireAuth, vehicle.getAreaDetails);

// GET /api/parking/area/:areaId/vehicles-for-removal
router.get('/vehicle/:areaId/vehicles-for-removal', requireAuth, vehicle.getVehiclesForRemoval);

// POST /api/parking/area/:areaId/manual-input
router.post('/vehicle/:areaId/manual-input', requireAuth, vehicle.manualInputVehicle);

// POST /api/parking/simulate
router.post('/simulate', vehicle.handleSimulation);

// API for data analysis without authentication
// create new function controller to fetch the API
router.get('/analysis/area', area.getAreaByBusiness);
// router.get('/')
export default router;
