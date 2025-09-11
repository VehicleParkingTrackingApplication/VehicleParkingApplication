import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Record = new Schema({
    areaId: { type: String, ref: 'areas', required: true },
    plateNumber: { type: String, required: true },
    country: { type: String, required: true },
    confidence: { type: Number, required: true },
    angle: { type: Number, required: true },
    image: { type: String, required: true },
    entryTime: { type: Date, required: true },
    leavingTime: { type: Date, default: null },
    duration: { type: Number, required: true, default: 0 },
});

export default mongoose.model('records', Record);
