import moongoose from 'mongoose';
const Schema = moongoose.Schema;

const ParkingVehicleSchema = new Schema({
    parking_area_id: { 
        type: Schema.Types.ObjectId,
        ref: 'parking area',
        required: true
    },
    date: {
        type: Date, 
        required: true
    },
    time: {
        type: String,
        required: true
    },
    plate_number: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
        default: 'AUS'
    },
    confidence_score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    camera_id: {
        type: Number,
        required: true
    },
    image_file: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['APPROACHING', 'LEAVING', 'UNKNOWN'],
        required: true
    },
    entry_time:{
        type: Date,
        default: null
    },
    exit_time: {
        type: Date,
        default: null
    },
    duration: {
        type: Number, // duration in minutes
        default: 0
    }
}, { timestamps: true });

// Index for faster queries
// ParkingVehicleSchema.index({ parking_area_id: 1, date: 1 });
// ParkingVehicleSchema.index({ license_plate: 1 });
// ParkingVehicleSchema.index({ status: 1 });

// method to calculate the duration of the vehicle come in and leav the parking area
ParkingVehicleSchema.methods.calculationDuration = function() {
    if (this.entry_time && this.exit_time) {
        const durationMs = this.exit_time - this.entry_time;
        this.duration = Math.round(durationMs / (1000 * 60));
    }
}

export default moongoose.model('parking vehicles', ParkingVehicleSchema)
