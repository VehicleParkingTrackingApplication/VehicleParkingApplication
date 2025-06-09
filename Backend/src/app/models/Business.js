import moongoose from 'mongoose';
const Schema = moongoose.Schema;

const Business = new Schema({
    // id: { type: String, maxLength: 255 },
    name: { type: String, required: true, trim: true, maxLength: 100 },
    parkingArea: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

export default moongoose.model('businesses', Business);
