import express from 'express';
import HomeController from '../app/controllers/HomeController.js';
import importCSVData from '../utils/dataImport.js';

const router = express.Router();

/**
 * @swagger
 * /home/import-camera-data:
 *   get:
 *     tags: [Home]
 *     summary: Import camera data from CSV
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Camera data imported successfully
 *       500:
 *         description: Server error during import
 */
router.get('/import-camera-data', async (req, res) => {
    try {
        const results = await importCSVData('2025-04-02.csv');
        res.status(200).json({ 
            message: `Successfully imported ${results.length} records`,
            data: results 
        });
    } catch (error) {
        console.error('Error importing camera data:', error);
        res.status(500).json({ 
            message: 'Failed to import camera data',
            error: error.message 
        });
    }
});

// router.use(':slug', NewsController.show);
// router.get('/login', HomeController.login);
// router.post('/login', async (req, res) => HomeController.loginPost(req, res));
// router.post('/logout', async (req, res) => HomeController.logout(req, res));
// router.get('/register', HomeController.register);
// router.post('/register', async (req, res) =>
//   HomeController.registerPost(req, res),
// );
router.get('/import-data', async (req, res) =>
    HomeController.importData(req, res),
);
router.get('/import-business-data', async (req, res) =>
    HomeController.importBusinessData(req, res),
);
router.get('/import-parking-area-data', async (req, res) =>
    HomeController.importParkingAreaData(req, res),
);

router.get('/', HomeController.index);

export default router;
