import Vehicle from '../models/Vehicle.js';

class parkingVehicleController {
    async getParkingVehicleByParkingArea(req, res) {
        try {
            const parkingAreaId = req.query.parkingAreaId;
            if (!parkingAreaId) {
                return res.status(400).json({
                    success: false,
                    message: 'Parking area ID is required'
                });
            }

            const page = parseInt(req.query.page) - 1 || 0;
            const limit = parseInt(req.query.limit) || 10;
            
            const vehicles = await Vehicle.find(
                { 
                    parkingAreaId: parkingAreaId
                })
                .skip(page*limit)
                .limit(limit)
                .sort({
                    date: -1,
                    time: -1
                });
            return res.status(200).json({
                success: true,
                vehicles
            })
            

        } catch (error) {
            return res.status(500).json({
                message: 'Error fetching parking vehicles',
                error: error.message
            });
        }
    }
    
    // note the request body in the API
    async inputVehicle(req, res) {
        try {
            const {
                areaId, 
                date,
                time,
                plateNumber,
                country,
                confidence,
                angle,
                image,
                status
            } = req.body;
            // return the missing value for server, can use to analysis the accuracy of camera
            if ( !areaId || !date || !time || !plateNumber || !status ) {
                return res.status(500).json({
                    success: false,
                    message: "Missing required fields"
                });
            }
            
            // convert date and time into datetime variable
            let datetime;
            if (date.include('/')) {
                // DD/MM/YYYY
                const [ day, month, year ] = date.split('/');
                datetime = new Date(`${year}-${month}-${day}T${time}`);
            } else {
                // assume date formate YYYY-MM-DD
                datetime = new Date(`${date}T${time}`);
            }

            // insert log into collection Record 
            recordData = {
                areaId, datetime, plateNumber, 
                country: country || 'AUS',
                confidence: parseInt(confidence),
                angle: parseInt(angle),
                image,
                status
            };
            await Record.create(recordData);

            // maintain the collection Vehicle, insert when status APPROACHING and delete when status is LEAVING
            if ( status === 'APPROACHING' ) {
                const existCar = await Vehicle.findOne({ areaId, plateNumber });
                if (!existCar) {
                    // this car not entry the parking area -> add to vehicle collection
                    const vehicleData = {
                        areaId, plateNumber, country, image, datetime
                    };
                    await Vehicle.create(vehicleData);
                }
            } else if (status === "LEAVING") {
                await vehicle.deleteOne({areaId, plateNumber});
            }

            return res.status(201).json({
                success: true,
                message: 'Vehicle data processed successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error API processing vehicle data',
                error: error.message
            })
        }
    }

    async handleSimulation(req, res) {
        try {
            const {
                parkingAreaId,
                date,
                time,
                plateNumber,
                country,
                confidence,
                angle,
                image,
                status
            } = req.body;

            // Validate required fields
            if (!parkingAreaId || !date || !time || !plateNumber || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Create new vehicle record
            const vehicleData = {
                parkingAreaId,
                date,
                time,
                plateNumber,
                country: country || 'AUS',
                confidence: parseInt(confidence) || 85,
                angle,
                image,
                status,
                entryTime: status === 'APPROACHING' ? new Date() : null,
                exitTime: status === 'LEAVING' ? new Date() : null
            };

            // If vehicle is leaving, find and update the existing record
            if (status === 'LEAVING') {
                const existingVehicle = await Vehicle.findOne({
                    parkingAreaId,
                    plateNumber,
                    status: 'APPROACHING'
                });

                if (existingVehicle) {
                    existingVehicle.status = 'LEAVING';
                    existingVehicle.exitTime = new Date();
                    existingVehicle.calculationDuration();
                    await existingVehicle.save();
                }
            } else {
                // Create new record for approaching vehicle
                const newVehicle = new Vehicle(vehicleData);
                await newVehicle.save();
            }

            return res.status(200).json({
                success: true,
                message: 'Simulation data processed successfully'
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error processing simulation data',
                error: error.message
            });
        }
    }
}

export default new parkingVehicleController();