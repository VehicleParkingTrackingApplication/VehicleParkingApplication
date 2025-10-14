import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const Employee_vehicle = new Schema({
    businessId: { 
        type: Schema.Types.ObjectId, 
        ref: 'businesses', 
        required: true },    
    areaId: {
        type: Schema.Types.ObjectId,
        ref: 'areas'
    },
    plateNumber: { 
        type: String, 
        required: true, 
        maxLength: 100 },
    owner: { 
        type: String, 
        required: true }
}, { timestamps: true });

// Compound index for efficient lookups
Employee_vehicle.index({ businessId: 1, plateNumber: 1 });
Employee_vehicle.index({ plateNumber: 1 });

export default mongoose.model('employee_vehicle', Employee_vehicle);
