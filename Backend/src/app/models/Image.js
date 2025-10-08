import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    areaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area',
        required: true
    },
    plateNumber: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    originalFileName: {
        type: String,
        required: true
    },
    s3Key: {
        type: String,
        required: true,
        unique: true
    },
    s3Url: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    },
    accessCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient queries
imageSchema.index({ areaId: 1, plateNumber: 1, date: 1 });
imageSchema.index({ s3Key: 1 });
imageSchema.index({ uploadedAt: 1 });

// Method to update access statistics
imageSchema.methods.updateAccess = function() {
    this.lastAccessedAt = new Date();
    this.accessCount += 1;
    return this.save();
};

const Image = mongoose.model('Image', imageSchema);

export default Image;
