// const mooogoose = require('mooogoose');
import mongoose from 'mongoose';

async function connect() {
  try {
    await mongoose.connect('mongodb://localhost:27017/car_parking', {
      // binhnguyen_education_dev
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully!');
  } catch (error) {
    console.log('Error conneting to MongoDB: ', error);
  }
}

export default { connect };
