import moongoose from 'mongoose';
const Schema = moongoose.Schema;

const Business = new Schema({
    // id: { type: String, maxLength: 255 },
    email: { type: String, required: true, trim: true, maxLength: 100 },
    phoneNumber: {type: String, required: true, trim: true, maxLength: 100 },
    businessName: { type: String, required: true, trim: true, maxLength: 100 },
    location: { type: String, required: true, trim: true, maxLength: 100 },
    createdAt: { type: Date, default: Date.now },
});

export default moongoose.model('businesses', Business);
