import moongoose from 'mongoose';
const Schema = moongoose.Schema;

// const Location = new Schema(
//   {
//     address: { type: String, required: true },
//     suburb: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     postcode: { type: String, required: true },
//   },
//   { _id: false },
// );

const Area = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'businesses',
      required: true,
    },
    businessPhoneNumber: { type: Number },
    name: { type: String, required: true, trim: true },
    ftpServer: { type: Schema.Types.ObjectId, ref: 'ftpservers' },
    capacity: { type: Number, required: true, min: 1 },
    location: { type: String, required: true },
    policy: { type: String, default: '', trim: true },
    savedTimestamp: { type: String, default: ''},
    currentCapacity: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default moongoose.model('areas', Area);
