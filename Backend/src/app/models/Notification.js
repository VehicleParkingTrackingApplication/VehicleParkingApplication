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
      enum: ['over_24_hours_long_parking', "over_4_hours_long_parking"],
      default: 'capacity_warning',
    }
  },
  { timestamps: true },
);

// Index for efficient queries
Notification.index({ areaId: 1, status: 1 });
Notification.index({ createdAt: -1 });

export default moongoose.model('notifications', Notification);