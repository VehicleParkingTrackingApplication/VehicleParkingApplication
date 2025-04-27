import cameraData from '../models/CameraData.js';
import parkingArea from '../models/ParkingAreaSchema.js';
// import ParkingVehicles from '../models/ParkingVehicles.js';

class parkingController {
    async index(req, res) {
        const cameraDataJson = await cameraData.find({});
        return res.json(cameraDataJson);
    }

    async getParkingArea(req, res) {
        const parkingArea = await parkingArea.find();
        res.json(parkingInfoJson);
    }

    async getParkingVehicles(req, res) {
        const parkingVehicleJson = await ParkingVehicles.find();
        res.json(parkingVehicleJson);
    }
}

export default new parkingController();
