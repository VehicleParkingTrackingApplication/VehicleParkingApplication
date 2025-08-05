import Record from '../models/Record.js';
import Vehicle from '../models/Vehicle.js';
import Area from '../models/Area.js';

class parkingVehicleController {
    // Helper function to update area capacity
    async updateAreaCapacity(areaId, increment = true) {
        try {
            const updateOperation = increment ? 1 : -1;
            await Area.findByIdAndUpdate(
                areaId,
                { $inc: { currentCapacity: updateOperation } },
                { new: true }
            );
        } catch (error) {
            console.error(`Error updating area capacity for ${areaId}:`, error);
        }
    }

    async getExistingParkingVehicleByParkingArea(req, res) {
        try {
            const { areaId } = req.params;
            if (!areaId) {
                return res.status(400).json({
                    success: false,
                    message: 'Area ID is required'
                });
            }

            // Get pagination parameters from URL query
            const page = parseInt(req.query.page) - 1 || 0;
            const limit = parseInt(req.query.limit) || 10;
            
            // Get total count for pagination
            const total = await Vehicle.countDocuments({
                areaId: areaId
            });

            // Get vehicles with pagination
            const vehicles = await Vehicle.find(
                { 
                    areaId: areaId
                })
                .skip(page * limit)
                .limit(limit)
                .sort({
                    datetime: -1
                });

            // Calculate current duration for each vehicle
            const vehiclesWithDuration = vehicles.map(vehicle => {
                const vehicleObj = vehicle.toObject();
                
                // Calculate current duration
                const currentTime = new Date();
                const entryTime = vehicle.datetime;
                const durationMs = currentTime.getTime() - entryTime.getTime();
                const durationMinutes = Math.floor(durationMs / (1000 * 60));
                const durationHours = Math.floor(durationMinutes / 60);
                const remainingMinutes = durationMinutes % 60;

                return {
                    ...vehicleObj,
                    currentDuration: {
                        totalMinutes: durationMinutes,
                        hours: durationHours,
                        minutes: remainingMinutes,
                        milliseconds: durationMs / 1000
                    },
                    entryTime: entryTime,
                    currentTime: currentTime
                };
            });
            
            return res.status(200).json({
                success: true,
                vehicles: vehiclesWithDuration,
                pagination: {
                    total,
                    page: page + 1,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            return res.status(500).json({
                message: 'Error fetching parking vehicles',
                error: error.message
            });
        }
    }

    // get recent record for each parking area
    async getRecentRecords(req, res) {
        try {
            const { areaId } = req.params;
            
            if (!areaId) {
                return res.status(400).json({
                    success: false,
                    message: 'Area ID is required'
                });
            }

            // Get the 5 most recent records for the specified area
            const recentRecords = await Record.find({ areaId })
                .sort({ datetime: -1 }) // Sort by datetime descending (most recent first)
                .limit(5) // Limit to 5 records
                .select('plateNumber status datetime') // Only select needed fields
                .lean(); // Convert to plain JavaScript objects for better performance

            // Format the response to match the frontend expectations
            const formattedRecords = recentRecords.map(record => ({
                plate: record.plateNumber,
                action: record.status === 'APPROACHING' ? 'ENTRY' : 'EXIT',
                time: record.datetime.toLocaleTimeString('en-US', { 
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                date: record.datetime.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                })
            }));

            return res.status(200).json({
                success: true,
                data: formattedRecords
            });

        } catch (error) {
            console.error('Error fetching recent records:', error);
            return res.status(500).json({
                success: false,
                message: 'Error fetching recent records',
                error: error.message
            });
        }
    }

    // get all records for a parking area with pagination
    async getAllRecordsByArea(req, res) {
        try {
            const { areaId } = req.params;
            
            if (!areaId) {
                return res.status(400).json({
                    success: false,
                    message: 'Area ID is required'
                });
            }

            // Get pagination parameters from URL query
            const page = parseInt(req.query.page) - 1 || 0;
            const limit = parseInt(req.query.limit) || 10;
            
            // Get total count for pagination
            const total = await Record.countDocuments({ areaId });

            // Get records with pagination
            const records = await Record.find({ areaId })
                .sort({ datetime: -1 }) // Sort by datetime descending (most recent first)
                .skip(page * limit)
                .limit(limit)
                .select('plateNumber status datetime image country') // Select needed fields
                .lean(); // Convert to plain JavaScript objects for better performance

            // Format the response to match the frontend expectations
            const formattedRecords = records.map(record => ({
                _id: record._id,
                plate: record.plateNumber,
                action: record.status === 'APPROACHING' ? 'ENTRY' : 'EXIT',
                time: record.datetime.toLocaleTimeString('en-US', { 
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                date: record.datetime.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }),
                image: record.image,
                country: record.country
            }));

            return res.status(200).json({
                success: true,
                records: formattedRecords,
                pagination: {
                    total,
                    page: page + 1,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching all records:', error);
            return res.status(500).json({
                success: false,
                message: 'Error fetching all records',
                error: error.message
            });
        }
    }

    // input by params for vehicle
    async inputVehicleForm(req, res) {
        try {
            const {
                areaId, 
                date,
                time,
                plateNumber,
                country,
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
            if (date.includes('/')) {
                // DD/MM/YYYY
                const [ day, month, year ] = date.split('/');
                datetime = new Date(`${year}-${month}-${day}T${time}`);
            } else {
                // assume date formate YYYY-MM-DD
                datetime = new Date(`${date}T${time}`);
            }

            // insert log into collection Record 
            let recordData = {
                areaId, 
                datetime, 
                plateNumber, 
                country: country || 'AUS',
                angle: 0,
                confidence: 0,
                image,
                status
            };

            // Handle different status types
            if (status === 'APPROACHING') {
                // For approaching vehicles, just create the record
                await Record.create(recordData);

                // Check if vehicle already exists in Vehicle collection
                const existCar = await Vehicle.findOne({ areaId, plateNumber });
                if (existCar) {
                    // Vehicle already exists - camera missed the previous LEAVING event
                    // Delete the old record first
                    await Vehicle.deleteOne({ areaId, plateNumber });
                    console.log(`Removed existing vehicle for plateNumber ${plateNumber} (camera missed previous LEAVING event)`);
                    // Don't update capacity since we're replacing, not adding
                } else {
                    // New vehicle entering - increment capacity
                    await this.updateAreaCapacity(areaId, true);
                }
                
                // Create new vehicle record (whether it existed before or not)
                const vehicleData = {
                    areaId, 
                    plateNumber, 
                    country: country || 'AUS', 
                    image, 
                    datetime
                };
                await Vehicle.create(vehicleData);
                console.log(`Added vehicle for plateNumber ${plateNumber}`);
            } else if (status === "LEAVING") {
                // For leaving vehicles, we need to calculate duration
                
                // First, create the leaving record
                await Record.create(recordData);

                // Find the previous APPROACHING record for this vehicle
                const approachingRecord = await Record.findOne({
                    areaId,
                    plateNumber,
                    status: 'APPROACHING'
                }).sort({ datetime: -1 }); // Get the most recent approaching record

                if (approachingRecord) {
                    // Calculate duration in milliseconds
                    const durationMs = datetime.getTime() - approachingRecord.datetime.getTime();
                    
                    // Convert to minutes and hours
                    const durationMinutes = Math.floor(durationMs / (1000 * 60));
                    const durationHours = Math.floor(durationMinutes / 60);
                    const remainingMinutes = durationMinutes % 60;

                    recordData.duration = {
                        hours: durationHours,
                        minutes: remainingMinutes,
                        milliseconds: durationMs / 1000
                    };
                    recordData.entryTime = approachingRecord.datetime;

                    // Update the leaving record with duration information
                    await Record.create(recordData);

                    console.log(`Vehicle ${plateNumber} parked for ${durationHours}h ${remainingMinutes}m`);
                } else {
                    console.warn(`No approaching record found for vehicle ${plateNumber} - cannot calculate duration`);
                }

                // Remove the vehicle from Vehicle collection (it's no longer in the parking area)
                await Vehicle.deleteOne({ areaId, plateNumber });
                
                // Decrement capacity when vehicle leaves
                await this.updateAreaCapacity(areaId, false);
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
                    
                    // Decrement capacity when vehicle leaves
                    await this.updateAreaCapacity(parkingAreaId, false);
                }
            } else {
                // Create new record for approaching vehicle
                const newVehicle = new Vehicle(vehicleData);
                await newVehicle.save();
                
                // Increment capacity when vehicle enters
                await this.updateAreaCapacity(parkingAreaId, true);
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