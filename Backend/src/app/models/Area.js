import moongoose from 'mongoose';
const Schema = moongoose.Schema;

const Location = new Schema(
  {
    address: { type: String, required: true },
    suburb: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postcode: { type: String, required: true },
  },
  { _id: false },
);

const Price = new Schema(
  {
    car: { type: Number, required: true },
    motorbike: { type: Number, required: true },
    bicycle: { type: Number, required: true },
  },
  { _id: false },
);

const Area = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'businesses',
      required: true,
    },
    businessPhoneNumber: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    price: { type: Price, required: true },
    location: { type: Location, required: true },
    policy: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export default moongoose.model('areas', Area);
