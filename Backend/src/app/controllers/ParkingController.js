

class parkingController {
    async index(req, res) {
        const parkingAreaJson = await parkingAreas.find();
        res.json(parkingAreaJson);
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