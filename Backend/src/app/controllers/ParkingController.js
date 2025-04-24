import Camera_Data from '../models/CameraData.js';

class parkingController {
    async index(req, res) {
        const cameraData = await Camera_Data.find();
        res.json(cameraData)
    }
    async getParkingVehicles(req, res) {
        const parkingVehicleJson = await ParkingVehicles.find();
        res.json(parkingVehicleJson);
    }
    async getParkingInfo(req, res) {
        const parkingInfoJson = await ParkingInfo.find();
        res.json(parkingInfoJson);
    }
}

export default new parkingController();