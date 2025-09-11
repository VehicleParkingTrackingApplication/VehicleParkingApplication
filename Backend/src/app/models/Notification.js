import moongoose from 'mongoose';
const Schema = moongoose.Schema;

const Notification = new Schema(
  {
    areaId: {
      type: Schema.Types.ObjectId,
      ref: 'areas',
      required: true,
    },
    status: {
      type: String,
      enum: ['read', 'unread'],
      default: 'unread',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['capacity_warning', 'capacity_critical', 'long_parking', 'system'],
      default: 'capacity_warning',
    },
    threshold: {
      type: Number,
      default: 80, // percentage threshold
    },
    currentCapacity: {
      type: Number,
      required: true,
    },
    totalCapacity: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

// Index for efficient queries
Notification.index({ areaId: 1, status: 1 });
Notification.index({ createdAt: -1 });

export default moongoose.model('notifications', Notification);