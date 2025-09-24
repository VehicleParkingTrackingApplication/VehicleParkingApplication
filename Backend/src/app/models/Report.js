import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Report = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    areaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParkingArea', // Ensure you have a 'ParkingArea' model
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['hourly-activity', 'entries-over-time', 'overstay-analysis']
    },
    description: String,
    
    // --- ADD THIS LINE ---
    chartImage: String,

    chartData: mongoose.Schema.Types.Mixed,
    filters: mongoose.Schema.Types.Mixed,
    createdAt: {
        type: Date,
        default: Date.now
    },
    isShared: {
        type: Boolean,
        default: false
    },
    sharedWith: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }]
});

export default mongoose.model('reports', Report);