import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Comment = new Schema({
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reports',
        required: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxLength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
Comment.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('comments', Comment);
