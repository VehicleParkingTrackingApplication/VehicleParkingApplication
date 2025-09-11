import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxLength: 255
    },
    password: {
        type: String,
        required: true,
        maxLength: 255
    },
    businessId: {
        type: Schema.Types.ObjectId,
        ref: 'businesses',
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'user'],
        default: 'user' 
    },
    firstName: {
        type: String,
        maxLength: 255
    },
    lastName: {
        type: String,
        maxLength: 255
    },
    phoneNumber: {
        type: String,
        trim: true,
        maxLength: 50
    },
    address: {
        type: String,
        trim: true,
        maxLength: 1024
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        required: true, // Making email required for registration.
        maxLength: 255
    },
    loggedSessions: {
        type: [String],
        default: []
    },
    profileCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model('users', userSchema);
