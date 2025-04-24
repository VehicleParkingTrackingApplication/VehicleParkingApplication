import moongoose from 'mongoose';
const Schema = moongoose.Schema;

const LocationSchema = new Schema({
    address:   { type: String, required: true },
    suburb:    { type: String, required: true },
    city:      { type: String, required: true },
    state:     { type: String, required: true },
    postcode:  { type: String, required: true },
  }, { _id: false });

  const PriceSchema = new Schema({
    car:        { type: Number, required: true },
    motorbike:  { type: Number, required: true },
    bicycle:    { type: Number, required: true },
  }, { _id: false });

const ParkingAreaSchema = new Schema({ 
    business_id: { type: Schema.Types.ObjectId, ref: 'Business', required: true }, 
    business_phone_number: {type: Number, required: true},
    name: { type: String, required: true, trim: true }, 
    maxSlot: { type: Number, required: true, min: 1 }, 
    currentSlot: { type: Number, default: 0, min: 0 }, 
    price: { type: PriceSchema, required: true }, 
    location: { type: LocationSchema, required: true }, 
    policy: { type: String, default: '', trim: true } 
}, { timestamps: true });

export default moongoose.model('parking area', ParkingAreaSchema);
