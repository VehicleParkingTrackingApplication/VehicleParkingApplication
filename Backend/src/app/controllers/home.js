// import importCSVData from '../../utils/data-import.js';
import businessImport from '../../utils/business-import.js';
import parkingAreaImport from '../../utils/parking-area-import.js';

import dotenv from 'dotenv';

dotenv.config();

class homeController {
    index(req, res) {
        res.json({"Check": "Hello home page"});
    }
}

export default new homeController();
