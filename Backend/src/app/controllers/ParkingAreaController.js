import cameraData from '../models/CameraData.js';
import ParkingAreaSchema from '../models/ParkingAreaSchema.js';
import ParkingVehicleSchema from '../models/ParkingVehicleSchema.js';


class parkingController {
    async index(req, res) {
        const parkingArea = await ParkingAreaSchema.find({});
        return res.json(parkingArea);
    }

    // get all parking areas of a business
    async getParkingAreaByBusiness(req, res) {
        try {
            const businessId = req.user.businessId;
            // console
            if (!businessId) {
                return res.status(400).json({
                    message: 'Business ID is required'
                });
            }
            const page = parseInt(req.query.page) - 1 || 0;
            const limit = parseInt(req.query.limit) || 3;
            const search = req.query.search || "";
            // Create RegExp object for the search
            const searchRegex = new RegExp(search, 'i'); // i for case-sensitive
            //sorting
            let sortField = req.query.sortBy || "createdAt";
            let sortOrder =  req.query.sortOrder === "desc" ? -1 : 1;
            const sort = { [sortField]: sortOrder };

            // const parkingArea = await ParkingAreaSchema.find({});
            // return res.json(parkingArea);

            console.log("Check");
            const ParkingArea = await ParkingAreaSchema.find(
                {  
                    business_id: businessId, 
                    name: { $regex: searchRegex }
                })
                .skip(page * limit)
                .limit(limit);
                
            console.log(page, limit, search);
            const total = await ParkingAreaSchema.countDocuments({
                business_id: businessId, 
                name: { $regex: searchRegex }
            })

            if (!ParkingArea || ParkingArea.length === 0) {
                return res.status(400).json({
                    message: 'No parking areas registered for this business!!!'
                });
            }
            return res.status(200).json({
                data: ParkingArea,
                pagination: {
                    total,
                    page: page + 1,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
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
