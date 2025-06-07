import moongoose from 'mongoose';
const Schema = moongoose.Schema;

const locationSchema = new Schema(
  {
    address: { type: String, required: true },
    suburb: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postcode: { type: String, required: true },
  },
  { _id: false },
);

const priceSchema = new Schema(
  {
    car: { type: Number, required: true },
    motorbike: { type: Number, required: true },
    bicycle: { type: Number, required: true },
  },
  { _id: false },
);

const parkingAreaSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    businessPhoneNumber: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    maxSlot: { type: Number, required: true, min: 1 },
    currentSlot: { type: Number, default: 0, min: 0 },
    price: { type: priceSchema, required: true },
    location: { type: locationSchema, required: true },
    policy: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export default moongoose.model('parking areas', parkingAreaSchema);
