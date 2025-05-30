// const mooogoose = require('mooogoose');
import mongoose from 'mongoose';

const dbConnect = async () => {
    try {
        const connect = await mongoose.connect(process.env.CONNECTION_STRING);
        console.log(`Connected to MongoDB successfully: ${connect.connection.host}`);
        console.log(`Database name: ${connect.connection.name}`);
        
        // Handle connection events
        // mongoose.connection.on('error', (err) => {
        //     console.error('MongoDB connection error:', err);
        // });

        // mongoose.connection.on('disconnected', () => {
        //     console.log('MongoDB disconnected');
        // });

        // process.on('SIGINT', async () => {
        //     await mongoose.connection.close();
        //     console.log('MongoDB connection closed through app termination');
        //     process.exit(0);
        // });
         
    } catch (error) {
        console.log('Error conneting to MongoDB: ', error);
    }
};

export default dbConnect;
