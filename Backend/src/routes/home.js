import express from 'express';
import homeController from '../app/controllers/homeController.js';
import importCSVData from '../utils/dataImport.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();


// router.get('/import-camera-data', async (req, res) => {
//     try {
//         const results = await importCSVData('2025-04-02.csv');
//         res.status(200).json({ 
//             message: `Successfully imported ${results.length} records`,
//             data: results 
//         });
//     } catch (error) {
//         console.error('Error importing camera data:', error);
//         res.status(500).json({ 
//             message: 'Failed to import camera data',
//             error: error.message 
//         });
//     }
// });

router.get('/import-data', async (req, res) =>
    homeController.importData(req, res)
);
router.get('/import-business-data', async (req, res) =>
    homeController.importBusinessData(req, res)
);
router.get('/import-parking-area-data', verifyJWT, async (req, res) => 
    homeController.importParkingAreaData(req, res)
);

// GET api/home
router.get('/', homeController.index);

export default router;
