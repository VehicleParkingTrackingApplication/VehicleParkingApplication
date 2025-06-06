import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const CameraData = new Schema({
    date: { type: String, required: true },
    time: { type: String, required: true },
    plateNumber: { type: String, required: true },
    country: { type: String, required: true },
    confidence: { type: String, required: true },
    angle: { type: String, required: true },
    image: { type: String, required: true },
    status: { type: String, required: true },
    duration: { type: String, default: '0' },
}, {
    timestamps: true,
    collection: 'camera_datas'
});

// Add index for better query performance
// CameraData.index({ date: 1, time: 1 });

export default mongoose.model('camera datas', CameraData);
