import moongoose from 'mongoose';
const Schema = moongoose.Schema;

const CameraData = new Schema({
  // id: { type: String, maxLength: 255 },
  date: { type: String, maxLength: 255 },
  time: { type: String, maxLength: 255 },
  plateNumber: { type: String, maxLength: 50 },
  country: { type: String, maxLength: 10 },
  confidence: { type: String, maxLength: 10 },
  angle: { type: String, maxLength: 10 },
  image: { type: String, maxLength: 255 },
  status: { type: String, maxLength: 100 },
  duration: { type: String, maxLength: 255, default: '0' },
});

export default moongoose.model('camera_data', CameraData);
