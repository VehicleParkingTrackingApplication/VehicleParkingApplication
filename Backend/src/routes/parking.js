import expess from 'express';
import parkingController from '../app/controllers/ParkingController.js';

const router = express.Router();


router.get('/parking-vehicles', parkingController.getParkingVehicles);
router.get('/parking_info', parkingController.getParkingInfo);
router.get('/', parkingController.index);