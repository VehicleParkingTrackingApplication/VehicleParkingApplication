import ParkingVehicleSchema from '../models/ParkingVehicleSchema.js';
import ParkingAreaSchema from '../models/ParkingAreaSchema.js';

class ParkingVehicleController {
    async getParkingVehicleByParkingArea(req, res) {
        try {
            const businessId = req.user.businessId;
            if (!businessId) {
                return res.status(400).json({
                    message: 'Business ID is required'
                });
            }
            const parkingArea = await ParkingAreaSchema.find({ business_id: businessId });
            
            

        } catch (error) {
            return res.status(500).json({
                message: 'Error fetching parking vehicles',
                error: error.message
            });
        }

    }
}

export default new ParkingVehicleController();