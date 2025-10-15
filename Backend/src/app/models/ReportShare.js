import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ReportShare = new Schema({
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reports',
        required: true
    },
    sharedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    sharedWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'businesses',
        required: true
    },
    permissions: {
        type: String,
        enum: ['view', 'comment'],
        default: 'comment'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only be shared a report once
ReportShare.index({ reportId: 1, sharedWith: 1 }, { unique: true });

export default mongoose.model('reportshares', ReportShare);
