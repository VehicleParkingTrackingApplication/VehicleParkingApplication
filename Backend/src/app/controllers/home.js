// import importCSVData from '../../utils/data-import.js';
import businessImport from '../../utils/business-import.js';
import parkingAreaImport from '../../utils/parking-area-import.js';

import dotenv from 'dotenv';

dotenv.config();

class homeController {
    index(req, res) {
        res.json({"message": "Hello home"});
    }
    
    async importData(req, res) {
        try {
            const filename = req.query.file || '2025-04-02.csv';
            const results = await importCSVData(req, res,filename);
            console.log(results);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }

    }
    async importBusinessData(req, res) {
        try {
            const results = await businessImport();
            console.log(results);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async importParkingAreaData(req, res) {
        try {
            const results = await parkingAreaImport(req, res);
            console.log(results);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new homeController();
