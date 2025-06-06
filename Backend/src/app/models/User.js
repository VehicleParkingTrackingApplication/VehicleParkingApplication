import moongoose from 'mongoose';
const Schema = moongoose.Schema;

const User = new Schema({
    username: { 
        type: String, 
        maxLength: 255 
    },
    password: { 
        type: String, 
        maxLength: 255 
    },
    business_id: {
        type: Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
        default: '683d4188a0c9a9af6e5d547c'
    },
    role: {
        type: String, 
        required: true,
        enum: ['admin', 'staff', 'customer']
    },
    firstName: { 
        type: String, 
        maxLength: 255 
    },
    lastName: { 
        type: String, 
        maxLength: 255 
    },
    email: { 
        type: String, 
        trim: true,
        maxLength: 255
    },
    createAt: { 
        type: Date, 
        default: Date.now 
    },
    updateAt: { 
        type: Date, 
        default: Date.now 
    },
    loggedSessions: {
        type: [String],
        default: []
    }
});

export default moongoose.model('User', User);
