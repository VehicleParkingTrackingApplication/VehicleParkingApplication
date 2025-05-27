import cameraData from '../models/CameraData.js';
import ParkingArea from '../models/ParkingAreaSchema.js';
import ParkingVehicle from '../models/ParkingVehicleSchema.js';


class parkingController {
    async index(req, res) {
        // res.json({ message: 'Parking Area Controller' });
        const cameraDataJson = await cameraData.find({});
        return res.json(cameraDataJson);
    }

    // get all parking areas of a business
    async getParkingAreaByBusiness(req, res) {
        try {
            const { businessId } = req.params;
            if (!businessId) {
                return res.status(400).json({
                    message: 'Business ID is required'
                });
            }
            const parkingAreas = await ParkingArea.find({ business_id: business_id });
            
            // const parkingAreas = await ParkingArea.find();

            if (!parkingAreas || parkingAreas.length === 0) {
                return res.status(400).json({
                    message: 'No parking areas found for this business'
                });
            }
        } catch (error) {
            return res.status(500).json({
                message: 'Error fetching parking areas',
                error: error.message
            });
        }
    }

    // POST: add new parking area, input the parking area information 
    // async ParkingAreaPost(req, res) {
    //     try{}
    // }


    // get all vehicles in a specific parking area
    async getVehiclesByParkingArea(req, res) {
        try {
            const { parkingAreaId } = req.params;
            if (!parkingAreaId) {
                return res.status(400).json({
                    message: 'Parking area ID is required'
                });
            }
            
            const parkingAreaExists = await ParkingArea.findById(parkingAreaId);
            if (!parkingAreaExists) {
                return res.status(400).json({
                    message: 'Parking area not found'
                });
            }
            // get all vehicles in the parking area
            const vehicles = await ParkingVehicle.find({
                parking_area_id: parkingAreaId
            })

            return res.status(200).json({ 
                parkingArea: parkingAreaExists,
                vehicles
            });
            
        } catch (error) {
            return res.status(500).json({
                message: 'Eror fetching vehicles',
                error: error.message
            })
        }
        
    }

    // get all parking areas of all business (use to check the database)
    async getParkingArea(req, res) {
        try {
            const parkingAreas = await ParkingArea.find();
            return res.status(200).json(parkingAreas);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching parking areas', error: error.message });
        }
    }

    async getParkingVehicles(req, res) {
        const parkingVehicleJson = await ParkingVehicles.find();
        res.json(parkingVehicleJson);
    }
}

export default new parkingController();
