import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Record = new Schema({
    areaId: { type: String, ref: 'areas', required: true },
    datetime: { type: Date, required: true },
    plateNumber: { type: String, required: true },
    country: { type: String, required: true },
    confidence: { type: String, required: true },
    angle: { type: String, required: true },
    image: { type: String, required: true },
    status: { type: String, required: true },
});

export default mongoose.model('records', Record);
