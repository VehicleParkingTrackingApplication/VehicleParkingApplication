import Record from '../models/Record.js';
import Vehicle from '../models/Vehicle.js';
import Area from '../models/Area.js';

class parkingVehicleController {
    // Helper function to update area capacity
    async updateAreaCapacity(areaId, increment = true) {
        try {
            const updateOperation = increment ? 1 : -1;
             // Get the current area data before updating
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`Area not found: ${areaId}`);
                return;
            }
            
            const oldCapacity = area.currentCapacity;
            const newCapacity = oldCapacity + updateOperation;
            
            // Update the area capacity
            await Area.findByIdAndUpdate(
                areaId,
                { $inc: { currentCapacity: updateOperation } },
                { new: true }
            );
            
            // Check if we need to create a notification (only when capacity increases)
            if (increment) {
                await this.checkAndCreateCapacityNotification(areaId, newCapacity, area.capacity);
            }
        } catch (error) {
            console.error(`Error updating area capacity for ${areaId}:`, error);
        }
    }

    async checkAndCreateCapacityNotification(areaId, currentCapacity, totalCapacity) {
        try {
            const threshold = 80; // 80% threshold
            const currentPercentage = Math.round((currentCapacity / totalCapacity) * 100);
            
            // Check if current capacity reaches or exceeds 80%
            if (currentPercentage >= threshold) {
                // Check if we already have a recent notification for this threshold
                const existingNotification = await Notification.findOne({
                    areaId,
                    type: 'capacity_warning',
                    threshold: threshold,
                    status: 'unread'
                }).sort({ createdAt: -1 });
                
                // Only create notification if:
                // 1. No existing unread notification for this threshold, OR
                // 2. The last notification was for a lower capacity (meaning we went below 80% and came back up)
                let shouldCreateNotification = true;
                
                if (existingNotification) {
                    const lastNotificationPercentage = Math.round((existingNotification.currentCapacity / existingNotification.totalCapacity) * 100);
                    
                    // If the last notification was for the same or higher percentage, don't create a new one
                    if (lastNotificationPercentage >= currentPercentage) {
                        shouldCreateNotification = false;
                    }
                }
                
                if (shouldCreateNotification) {
                    const message = `Parking area has reached ${currentPercentage}% capacity (${currentCapacity}/${totalCapacity} vehicles).`;
                    
                    await Notification.create({
                        areaId,
                        status: 'unread',
                        message,
                        type: 'capacity_warning',
                        threshold,
                        currentCapacity,
                        totalCapacity
                    });
                    
                    console.log(`Capacity notification created for area ${areaId}: ${message}`);
                }
            }
        } catch (error) {
            console.error(`Error checking capacity notification for area ${areaId}:`, error);
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
            
            // Get filter parameters from URL query
            const { startDate, endDate, startTime, endTime, status } = req.query;
            
            // Build filter object
            const filter = { areaId };
            
            // Add date range filter if provided
            if (startDate || endDate) {
                filter.datetime = {};
                if (startDate) {
                    let startDateTime = new Date(startDate);
                    // If startTime is provided, add it to the start date
                    if (startTime) {
                        const [hours, minutes, seconds = '00'] = startTime.split(':');
                        startDateTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);
                    }
                    filter.datetime.$gte = startDateTime;
                }
                if (endDate) {
                    let endDateTime = new Date(endDate);
                    // If endTime is provided, add it to the end date, otherwise set to end of day
                    if (endTime) {
                        const [hours, minutes, seconds = '59'] = endTime.split(':');
                        endDateTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 999);
                    } else {
                        endDateTime.setHours(23, 59, 59, 999);
                    }
                    filter.datetime.$lte = endDateTime;
                }
            } else if (startTime || endTime) {
                // If only time filters are provided (without date), apply to today
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
                
                filter.datetime = {};
                if (startTime) {
                    let startDateTime = new Date(todayStr);
                    const [hours, minutes, seconds = '00'] = startTime.split(':');
                    startDateTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);
                    filter.datetime.$gte = startDateTime;
                }
                if (endTime) {
                    let endDateTime = new Date(todayStr);
                    const [hours, minutes, seconds = '59'] = endTime.split(':');
                    endDateTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 999);
                    filter.datetime.$lte = endDateTime;
                }
            }
            
            // Add status filter if provided
            if (status) {
                if (status === 'ENTRY') {
                    filter.status = 'APPROACHING';
                } else if (status === 'EXIT') {
                    filter.status = 'LEAVING';
                } else {
                    // If status is not recognized, return error
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid status filter. Use "ENTRY" or "EXIT"'
                    });
                }
            }
            
            // Get total count for pagination with filters
            const total = await Record.countDocuments(filter);

            // Get records with pagination and filters
            const records = await Record.find(filter)
                .sort({ datetime: -1 }) // Sort by datetime descending (most recent first)
                .skip(page * limit)
                .limit(limit)
                .select('plateNumber status datetime image country angle confidence') // Include angle and confidence
                .lean(); // Convert to plain JavaScript objects for better performance
                
            console.log('Records found:', records.length);
            
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
                country: record.country,
                angle: record.angle,
                confidence: record.confidence
            }));
            
            return res.status(200).json({
                success: true,
                records: formattedRecords,
                pagination: {
                    total,
                    page: page + 1,
                    limit,
                    totalPages: Math.ceil(total / limit)
                },
                filters: {
                    startDate: startDate || null,
                    endDate: endDate || null,
                    startTime: startTime || null,
                    endTime: endTime || null,
                    status: status || null
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

    // Get areas by business ID for dropdown selection
    async getAreasByBusiness(req, res) {
        try {
            const { businessId } = req.params;
            
            if (!businessId) {
                return res.status(400).json({
                    success: false,
                    message: 'Business ID is required'
                });
            }

            const areas = await Area.find({ businessId })
                .select('_id name location capacity currentCapacity')
                .lean();

            return res.status(200).json({
                success: true,
                areas: areas
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error fetching areas by business',
                error: error.message
            });
        }
    }

    // Get existing vehicles for removal dropdown (for specific area)
    async getVehiclesForRemoval(req, res) {
        try {
            const { areaId } = req.params;
            
            if (!areaId) {
                return res.status(400).json({
                    success: false,
                    message: 'Area ID is required'
                });
            }

            // Verify area exists
            const area = await Area.findById(areaId);
            if (!area) {
                return res.status(404).json({
                    success: false,
                    message: 'Area not found'
                });
            }
            
            // Get all vehicles in this specific area
            const vehicles = await Vehicle.find({ areaId })
                .sort({ datetime: -1 })
                .lean();

            // Calculate current duration for each vehicle
            const vehiclesWithDuration = vehicles.map(vehicle => {
                const currentTime = new Date();
                const entryTime = vehicle.datetime;
                const durationMs = currentTime.getTime() - entryTime.getTime();
                const durationMinutes = Math.floor(durationMs / (1000 * 60));
                const durationHours = Math.floor(durationMinutes / 60);
                const remainingMinutes = durationMinutes % 60;

                return {
                    _id: vehicle._id,
                    plateNumber: vehicle.plateNumber,
                    country: vehicle.country,
                    areaName: area.name,
                    areaId: vehicle.areaId,
                    entryTime: entryTime,
                    currentDuration: {
                        totalMinutes: durationMinutes,
                        hours: durationHours,
                        minutes: remainingMinutes,
                        milliseconds: durationMs / 1000
                    }
                };
            });

            return res.status(200).json({
                success: true,
                vehicles: vehiclesWithDuration
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error fetching vehicles for removal',
                error: error.message
            });
        }
    }

    // Manual input vehicle form with Add/Remove actions
    async manualInputVehicle(req, res) {
        try {
            const { areaId } = req.params;
            const { action, vehicleData } = req.body;
            
            if (!areaId) {
                return res.status(400).json({
                    success: false,
                    message: 'Area ID is required'
                });
            }

            if (!action || !['ADD', 'REMOVE'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Action must be either "ADD" or "REMOVE"'
                });
            }

            // Verify area exists
            const area = await Area.findById(areaId);
            if (!area) {
                return res.status(404).json({
                    success: false,
                    message: 'Area not found'
                });
            }

            if (action === 'ADD') {
                // Handle ADD action
                const {
                    date,
                    time,
                    plateNumber,
                    country,
                    image,
                    status
                } = vehicleData;
                
                // Validate required fields for ADD
                if (!date || !time || !plateNumber || !status) {
                    return res.status(400).json({
                        success: false,
                        message: "Missing required fields for ADD action"
                    });
                }

                // Create vehicle data with the areaId from URL
                const fullVehicleData = {
                    areaId,
                    date,
                    time,
                    plateNumber,
                    country,
                    image,
                    status
                };
                
                // Process the ADD action using existing logic
                return await this.processVehicleInput(req, res, fullVehicleData);

            } else if (action === 'REMOVE') {
                // Handle REMOVE action
                const { vehicleId } = vehicleData;
                
                if (!vehicleId) {
                    return res.status(400).json({
                        success: false,
                        message: "Vehicle ID is required for REMOVE action"
                    });
                }

                // Find the vehicle to remove
                const vehicle = await Vehicle.findById(vehicleId);
                if (!vehicle) {
                    return res.status(404).json({
                        success: false,
                        message: "Vehicle not found"
                    });
                }

                // Verify the vehicle belongs to the specified area
                if (vehicle.areaId.toString() !== areaId) {
                    return res.status(400).json({
                        success: false,
                        message: "Vehicle doesn't belong to the specified area"
                    });
                }

                // Create a LEAVING record
                const currentTime = new Date();
                const recordData = {
                    areaId: vehicle.areaId,
                    datetime: currentTime,
                    plateNumber: vehicle.plateNumber,
                    country: vehicle.country,
                    angle: 0,
                    confidence: 0,
                    image: vehicle.image || '',
                    status: 'LEAVING'
                };

                // Calculate duration
                const durationMs = currentTime.getTime() - vehicle.datetime.getTime();
                const durationMinutes = Math.floor(durationMs / (1000 * 60));
                const durationHours = Math.floor(durationMinutes / 60);
                const remainingMinutes = durationMinutes % 60;

                recordData.duration = {
                    hours: durationHours,
                    minutes: remainingMinutes,
                    milliseconds: durationMs / 1000
                };
                recordData.entryTime = vehicle.datetime;

                // Create the leaving record
                await Record.create(recordData);

                // Remove vehicle from Vehicle collection
                await Vehicle.deleteOne({ _id: vehicleId });
                
                // Decrement area capacity
                await this.updateAreaCapacity(vehicle.areaId, false);

                return res.status(200).json({
                    success: true,
                    message: `Vehicle ${vehicle.plateNumber} removed successfully`,
                    removedVehicle: {
                        plateNumber: vehicle.plateNumber,
                        duration: recordData.duration,
                        entryTime: vehicle.datetime,
                        exitTime: currentTime
                    }
                });
            }

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error processing manual vehicle input',
                error: error.message
            });
        }
    }

    // Helper method to process vehicle input (extracted from original inputVehicleForm)
    async processVehicleInput(req, res, vehicleData) {
        try {
            const {
                areaId, 
                date,
                time,
                plateNumber,
                country,
                image,
                status
            } = vehicleData;
            
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
                message: 'Error processing vehicle data',
                error: error.message
            });
        }
    }

    // input by params for vehicle (legacy method - kept for backward compatibility)
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
            
            const vehicleData = {
                areaId, 
                date,
                time,
                plateNumber,
                country,
                image,
                status
            };
            
            // Use the helper method to process the input
            return await this.processVehicleInput(req, res, vehicleData);
            
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