import Area from '../models/Area.js';

class parkingAreaController {
    async index(req, res) {
        const parkingArea = await Area.find({});
        return res.json(parkingArea);
    }

    // get all parking areas of a business
    async getParkingAreaByBusiness(req, res) {
        try {
            const businessId = req.user.businessId;
            if (!businessId) {
                return res.status(400).json({
                    success: false,
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

            console.log("Searching with params:", { businessId, page, limit, search, sort });
            const parkingArea = await Area.find(
                {  
                    businessId: businessId, 
                    name: { $regex: searchRegex }
                })
                .skip(page * limit)
                .limit(limit)
                .sort(sort);
                
            console.log("Found parking areas:", parkingArea);
            const total = await Area.countDocuments({
                businessId: businessId, 
                name: { $regex: searchRegex }
            });

            if (!parkingArea || parkingArea.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No parking areas registered for this business!!!'
                });
            }
            return res.status(200).json({
                success: true,
                data: parkingArea,
                pagination: {
                    total,
                    page: page + 1,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error("Error in getParkingAreaByBusiness:", error);
            return res.status(500).json({
                success: false,
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
                    success: false,
                    message: 'Parking area ID is required'
                });
            }
            
            const parkingAreaExists = await Area.findById(parkingAreaId);
            if (!parkingAreaExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Parking area not found'
                });
            }
            // get all vehicles in the parking area
            const vehicles = await parkingVehicleSchema.find({
                parkingAreaId: parkingAreaId
            });

            return res.status(200).json({ 
                success: true,
                parkingArea: parkingAreaExists,
                vehicles
            });
            
        } catch (error) {
            console.error("Error in getVehiclesByParkingArea:", error);
            return res.status(500).json({
                success: false,
                message: 'Error fetching vehicles',
                error: error.message
            });
        }
    }

    // get all parking areas of all business (use to check the database)
    async getParkingArea(req, res) {
        try {
            const parkingAreas = await Area.find();
            return res.status(200).json({
                success: true,
                data: parkingAreas
            });
        } catch (error) {
            console.error("Error in getParkingArea:", error);
            return res.status(500).json({ 
                success: false,
                message: 'Error fetching parking areas', 
                error: error.message 
            });
        }
    }

    async getParkingVehicles(req, res) {
        const parkingVehicleJson = await ParkingVehicles.find();
        res.json(parkingVehicleJson);
    }
}

export default new parkingAreaController();
