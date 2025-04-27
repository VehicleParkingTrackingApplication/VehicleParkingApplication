import moongoose from 'mongoose';
const Schema = moongoose.Schema;

const BusinessSchema = new Schema({
  // id: { type: String, maxLength: 255 },
  name: { type: String, required: true, trim: true, maxLength: 100 },
  parkingAmount: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default moongoose.model('business', BusinessSchema);
