// src/routes/notification.js
import express from 'express';
import notification from '../app/controllers/notification.js';
import requireAuth from '../middleware/auth/require-auth.js';

const router = express.Router();

/**
 * @route GET /api/notification/business/:businessId/notifications
 * @desc Get all notifications for a business with pagination and filtering
 * @access Private
 * @param {string} businessId - The ID of the business to get notifications for
 * @query {string} [status] - Filter by notification status ('read' or 'unread')
 * @query {string} [type] - Filter by notification type ('capacity_warning', 'capacity_critical', 'blacklist_alert', 'system')
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=10] - Number of notifications per page
 * @returns {object} - Object containing notifications array and pagination info
 */
router.get('/business/:businessId/notifications', requireAuth, notification.getNotificationsByBusiness);

/**
 * @route PUT /api/notification/:notificationId/read
 * @desc Mark a specific notification as read
 * @access Private
 * @param {string} notificationId - The ID of the notification to mark as read
 * @returns {object} - Object containing the updated notification
 */
router.put('/:notificationId/read', requireAuth, notification.markAsRead);

/**
 * @route PUT /api/notification/business/:businessId/read-all
 * @desc Mark all notifications as read for a business
 * @access Private
 * @param {string} businessId - The ID of the business
 * @returns {object} - Object containing the number of notifications marked as read
 */
router.put('/business/:businessId/read-all', requireAuth, notification.markAllAsReadByBusiness);


export default router;
