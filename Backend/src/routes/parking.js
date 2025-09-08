import express from 'express';
import area from '../app/controllers/area.js';
import vehicle from '../app/controllers/vehicle.js'
import requireAuth from '../middleware/auth/require-auth.js';

const router = express.Router();


// GET /api/parking/area
router.get('/area', requireAuth, area.getAllAreasByBusiness);

// POST /api/parking/area/input-area
router.post('/area/input-area', requireAuth, area.inputParkingArea);

// POST /api/parking/area/input-ftpserver
router.post('/area/:areaId/input-ftpserver', requireAuth, area.inputFtpServer);

// PUT /api/parking/area/update-ftpserver
router.put('/area/:areaId/update-ftpserver', requireAuth, area.updateFtpServer);

// POST /api/parking/area/:areaId/trigger-ftp
router.post('/area/:areaId/trigger-ftp', requireAuth, area.triggerFtpServer);

/**
 * Test FTP Server connection
 * GET /api/parking/area/status-ftpserver
 */
router.get('/area/status-ftpserver', requireAuth, area.testFtpServerConnection);


/**
 * Get area details
 * GET /api/parking/area/:areaId/details
 */
router.get('/area/:areaId/details', requireAuth, area.getAreaDetails);

/**
 * Input vehicle manually
 * POST /api/parking/area/:areaId/manual-input
 */
router.post('/vehicle/:areaId/manual-input', requireAuth, vehicle.manualInputVehicle);

// GET /api/parking/vehicle/:areaId/existing-vehicles
router.get('/vehicle/:areaId/existing-vehicles', requireAuth, vehicle.getExistingVehicleByAreaId);

// GET /api/vehicle/:areaId/recent-records
router.get('/vehicle/:areaId/recent-records', requireAuth, vehicle.getRecentRecords);

// GET /api/parking/vehicle/:areaId/all-records
router.get('/vehicle/:areaId/all-records', requireAuth, vehicle.getAllRecordsByAreaId);

// New routes for manual input workflow with areaId
// GET /api/parking/area/:areaId/details
// router.get('/area/:areaId/details', requireAuth, vehicle.getAreaDetails);

// GET /api/parking/area/:areaId/vehicles-for-removal
router.get('/vehicle/:areaId/vehicles-for-removal', requireAuth, vehicle.getVehiclesForRemoval);

// POST /api/parking/simulate
router.post('/simulate', vehicle.handleSimulation);

// API for data analysis without authentication
// create new function controller to fetch the API
// router.get('/analysis/area', area.getAreaByBusiness);

export default router;
