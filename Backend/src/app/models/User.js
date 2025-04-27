import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const User = new Schema({
  userName: { type: String, maxLength: 255 },
  password: { type: String, maxLength: 255 },
  firstName: { type: String, maxLength: 255 },
  lastName: { type: String, maxLength: 255 },
  email: { type: String, maxLength: 255 },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', User);
