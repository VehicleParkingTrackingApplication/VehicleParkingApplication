import moongoose from 'mongoose';
const Schema = moongoose.Schema;
const Blacklist = new Schema({
    businessId: { 
        type: Schema.Types.ObjectId, 
        ref: 'businesses', 
        required: true },    
    plateNumber: { 
        type: String, 
        required: true, 
        maxLength: 100 },
    reason: { 
        type: String, 
        required: true, 
        maxLength: 100 },
    createdAt: { 
        type: Date, 
        default: Date.now }
}, { timestamps: true });

// Compound index for efficient lookups
Blacklist.index({ businessId: 1, plateNumber: 1, country: 1 });
Blacklist.index({ plateNumber: 1, country: 1, isActive: 1 });

export default moongoose.model('blacklist', Blacklist);