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

    // Render registration form
    // [GET] /parking-area-management/register-new
    async getRegisterParkingArea(req, res) {
        res.render('parkingAreaRegistration/form');
    }

    // Register new parking area and confirm registration status
    // [POST] /parking-area-management/registration-confirm
    async postRegisterParkingArea(req, res) {
        var data = {
            business_id: req.body.business_id,
            business_phone_number: req.body.business_phone_number,
            name: req.body.name,
            maxSlot: req.body.maxSlot,
            price: {
                car: req.body.price_car,
                motorbike: req.body.price_motorbike,
                bicycle: req.body.price_bicycle,
            },
            location: {
                address: req.body.location_address,
                suburb: req.body.location_suburb,
                city: req.body.location_city,
                state: req.body.location_state,
                postcode: req.body.location_postcode,
            },
            policy: req.body.policy,
        }
        res.json(data);
    }
}

export default new parkingController();
