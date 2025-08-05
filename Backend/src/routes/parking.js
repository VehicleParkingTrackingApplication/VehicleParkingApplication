import express from 'express';
import area from '../app/controllers/area.js';
import vehicle from '../app/controllers/vehicle.js'
import requireAuth from '../middleware/auth/require-auth.js';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file upload
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         const uploadDir = path.join(__dirname, '..', 'public', 'simulation');
//         if (!fs.existsSync(uploadDir)) {
//             fs.mkdirSync(uploadDir, { recursive: true });
//         }
//         cb(null, uploadDir);
//     },
//     filename: function (req, file, cb) {
//         // Use the original filename
//         cb(null, file.originalname);
//     }
// });

// const upload = multer({ storage: storage });

// GET /api/parking/area
router.get('/area', requireAuth, area.getAreaByBusiness);

// POST /api/parking/area/input-area
router.post('/area/input-area', requireAuth, area.inputParkingArea);

// POST /api/parking/area/input-ftpserver
router.post('/area/input-ftpserver', requireAuth, area.inputFtpServer);

// PUT /api/parking/area/update-ftpserver
// router.put('/area/update-ftpserver', requireAuth, area.updateFtpServer);

// POST /api/parking/area/input-vehicle
router.post('/area/input-vehicle', requireAuth, vehicle.inputVehicleForm);

// GET /api/parking/vehicle/:areaId/existing-vehicles
router.get('/vehicle/:areaId/existing-vehicles', requireAuth, vehicle.getExistingParkingVehicleByParkingArea);

// GET /api/vehicle/:areaId/recent-records
router.get('/vehicle/:areaId/recent-records', requireAuth, vehicle.getRecentRecords);

// GET /api/parking/vehicle/:areaId/all-records
router.get('/vehicle/:areaId/all-records', requireAuth, vehicle.getAllRecordsByArea);

// POST /api/parking/simulate
router.post('/simulate', vehicle.handleSimulation);


// Endpoint to receive vehicle data
// router.post('/vehicle/input/data', async (req, res) => {
//     try {
//         const vehicleData = req.body;

//         // Validate required fields
//         const requiredFields = ['date', 'time', 'parkingAreaId', 'plateNumber', 'country', 'confidence', 'angle', 'image', 'status'];
//         for (const field of requiredFields) {
//             if (!vehicleData[field]) {
//                 return res.status(400).json({ error: `Missing required field: ${field}` });
//             }
//         }

//         // Here you would typically save to your database
//         // For now, we'll just return success
//         res.json({
//             message: 'Vehicle data received successfully',
//             data: vehicleData
//         });

//     } catch (error) {
//         console.error('Error processing vehicle data:', error);
//         res.status(500).json({ error: 'Error processing vehicle data' });
//     }
// });

export default router;
