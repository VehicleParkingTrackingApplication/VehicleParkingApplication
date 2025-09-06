// src/app/controllers/notification.js
import Notification from '../models/Notification.js';
import Area from '../models/Area.js';

class NotificationController {
    // Get all notifications for a business (through areas)
    async getNotificationsByBusiness(req, res) {
        try {
            const { businessId } = req.params;
            const { status, page = 1, limit = 10 } = req.query;
            
            if (!businessId) {
                return res.status(400).json({
                    success: false,
                    message: 'Business ID is required'
                });
            }

            // Get all areas for this business
            const areas = await Area.find({ businessId }).select('_id');
            const areaIds = areas.map(area => area._id);

            // Build filter
            const filter = { areaId: { $in: areaIds } };
            if (status && ['read', 'unread'].includes(status)) {
                filter.status = status;
            }

            // Get pagination parameters
            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            // Get total count
            const total = await Notification.countDocuments(filter);

            // Get notifications with pagination
            const notifications = await Notification.find(filter)
                .populate('areaId', 'name location')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean();

            return res.status(200).json({
                success: true,
                notifications,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error fetching notifications',
                error: error.message
            });
        }
    }

    // Mark notification as read
    async markAsRead(req, res) {
        try {
            const { notificationId } = req.params;
            
            if (!notificationId) {
                return res.status(400).json({
                    success: false,
                    message: 'Notification ID is required'
                });
            }

            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                { status: 'read' },
                { new: true }
            ).populate('areaId', 'name location');

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Notification marked as read',
                notification
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error marking notification as read',
                error: error.message
            });
        }
    }

    // Mark all notifications as read for a business
    async markAllAsReadByBusiness(req, res) {
        try {
            const { businessId } = req.params;
            
            if (!businessId) {
                return res.status(400).json({
                    success: false,
                    message: 'Business ID is required'
                });
            }

            // Get all areas for this business
            const areas = await Area.find({ businessId }).select('_id');
            const areaIds = areas.map(area => area._id);

            // Update all unread notifications
            const result = await Notification.updateMany(
                { 
                    areaId: { $in: areaIds },
                    status: 'unread'
                },
                { status: 'read' }
            );

            return res.status(200).json({
                success: true,
                message: `${result.modifiedCount} notifications marked as read`,
                modifiedCount: result.modifiedCount
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error marking notifications as read',
                error: error.message
            });
        }
    }

}

export default new NotificationController();