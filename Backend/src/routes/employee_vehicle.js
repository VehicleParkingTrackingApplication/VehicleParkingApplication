import express from 'express';
import employeeVehicleController from '../app/controllers/employee_vehicle.js';
import requireAuth from '../middleware/auth/require-auth.js';

const router = express.Router();

// POST /api/employee-vehicle/add
// BODY: { plateNumber, owner, areaId? }
// Add a vehicle to employee vehicles
router.post('/add', requireAuth, employeeVehicleController.addEmployeeVehicle);

// GET /api/employee-vehicle/list
// QUERY: { page?, limit?, areaId? }
// Get list of employee vehicles for the business
router.get('/list', requireAuth, employeeVehicleController.getEmployeeVehicles);

// DELETE /api/employee-vehicle/remove
// BODY: { vehicleId }
// Remove a vehicle from employee vehicles
router.delete('/remove', requireAuth, employeeVehicleController.removeEmployeeVehicle);

export default router;
