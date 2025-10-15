import Employee_vehicle from '../models/Employee_vehicle.js';
import Area from '../models/Area.js';

class employeeVehicleController {
    
    // POST /api/employee-vehicle/add
    async addEmployeeVehicle(req, res) {
        try {
            const { plateNumber, owner, areaId } = req.body;
            const businessId = req.user.businessId;

            // Validate required fields
            if (!plateNumber || !owner) {
                return res.status(400).json({
                    success: false,
                    message: 'Plate number and owner are required'
                });
            }

            if (!businessId) {
                return res.status(400).json({
                    success: false,
                    message: 'Business ID is required'
                });
            }

            // Verify area exists and belongs to the current user's business (if areaId provided)
            if (areaId) {
                const area = await Area.findOne({ _id: areaId, businessId: businessId });
                if (!area) {
                    return res.status(404).json({
                        success: false,
                        message: "Area not found or you don't have access to this area"
                    });
                }
            }

            // Check if vehicle is already in employee vehicles for this business
            const existingEmployeeVehicle = await Employee_vehicle.findOne({
                businessId: businessId,
                plateNumber: plateNumber
            });

            if (existingEmployeeVehicle) {
                return res.status(400).json({
                    success: false,
                    message: 'Vehicle is already registered as an employee vehicle'
                });
            }

            // Create new employee vehicle record
            const employeeVehicleData = {
                businessId: businessId,
                plateNumber: plateNumber,
                owner: owner,
                areaId: areaId || null
            };

            const newEmployeeVehicle = new Employee_vehicle(employeeVehicleData);
            await newEmployeeVehicle.save();

            return res.status(201).json({
                success: true,
                message: 'Employee vehicle added successfully',
                data: {
                    id: newEmployeeVehicle._id,
                    plateNumber: newEmployeeVehicle.plateNumber,
                    owner: newEmployeeVehicle.owner,
                    areaId: newEmployeeVehicle.areaId,
                    businessId: newEmployeeVehicle.businessId,
                    createdAt: newEmployeeVehicle.createdAt
                }
            });

        } catch (error) {
            console.error('Error adding employee vehicle:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // GET /api/employee-vehicle/list
    async getEmployeeVehicles(req, res) {
        try {
            const businessId = req.user.businessId;
            const { page = 1, limit = 10, areaId } = req.query;

            if (!businessId) {
                return res.status(400).json({
                    success: false,
                    message: 'Business ID is required'
                });
            }

            // Build query filter
            const filter = { businessId: businessId };
            
            // Add area filter if provided
            if (areaId) {
                filter.areaId = areaId;
            }

            // Calculate pagination
            const skip = (page - 1) * limit;

            // Get employee vehicles with pagination
            const employeeVehicles = await Employee_vehicle.find(filter)
                .populate('areaId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            // Get total count for pagination
            const totalVehicles = await Employee_vehicle.countDocuments(filter);

            return res.status(200).json({
                success: true,
                message: 'Employee vehicles retrieved successfully',
                data: employeeVehicles,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalVehicles / limit),
                    totalVehicles: totalVehicles,
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Error getting employee vehicles:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // DELETE /api/employee-vehicle/remove
    async removeEmployeeVehicle(req, res) {
        try {
            const { vehicleId } = req.body;
            const businessId = req.user.businessId;

            if (!vehicleId) {
                return res.status(400).json({
                    success: false,
                    message: 'Vehicle ID is required'
                });
            }

            if (!businessId) {
                return res.status(400).json({
                    success: false,
                    message: 'Business ID is required'
                });
            }

            // Find and delete the employee vehicle
            const employeeVehicle = await Employee_vehicle.findOneAndDelete({
                _id: vehicleId,
                businessId: businessId
            });

            if (!employeeVehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee vehicle not found or you do not have permission to delete it'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Employee vehicle removed successfully',
                data: {
                    id: employeeVehicle._id,
                    plateNumber: employeeVehicle.plateNumber,
                    owner: employeeVehicle.owner
                }
            });

        } catch (error) {
            console.error('Error removing employee vehicle:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

export default new employeeVehicleController();
