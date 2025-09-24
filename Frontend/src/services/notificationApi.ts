import { fetchAuthApi, putAuthApi, deleteAuthApi } from './api';

// Notification interfaces
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  businessId?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalNotifications: number;
    limit: number;
  };
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  businessId?: string;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Get the last 10 notifications for the current user's business
 * @returns {Promise<NotificationResponse | null>}
 */
export async function getRecentNotifications(): Promise<NotificationResponse | null> {
  try {
    const response = await fetchAuthApi('notification/getRecentNotifications');
    
    if (!response.ok) {
      console.error('Failed to fetch last 10 notifications:', response.status, response.statusText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching last 10 notifications:', error);
    return null;
  }
}

/**
 * Get all notifications for the current user's business with optional filters
 * @param {NotificationFilters} filters - Optional filters for notifications
 * @returns {Promise<NotificationResponse | null>}
 */
export async function getAllNotifications(
  filters?: NotificationFilters
): Promise<NotificationResponse | null> {
  try {
    const queryParams: Record<string, string> = {};
    
    if (filters) {
      if (filters.isRead !== undefined) queryParams.isRead = filters.isRead.toString();
      if (filters.type) queryParams.type = filters.type;
      if (filters.userId) queryParams.userId = filters.userId;
      if (filters.startDate) queryParams.startDate = filters.startDate;
      if (filters.endDate) queryParams.endDate = filters.endDate;
      if (filters.page) queryParams.page = filters.page.toString();
      if (filters.limit) queryParams.limit = filters.limit.toString();
    }

    const response = await fetchAuthApi('notification/getAllNotifications', queryParams);
    
    if (!response.ok) {
      console.error('Failed to fetch notifications:', response.status, response.statusText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return null;
  }
}

/**
 * Get a specific notification by ID
 * @param {string} notificationId - The notification ID
 * @returns {Promise<Notification | null>}
 */
export async function getNotification(notificationId: string): Promise<Notification | null> {
  try {
    const response = await fetchAuthApi(`notifications/${notificationId}`);
    
    if (!response.ok) {
      console.error('Failed to fetch notification:', response.status, response.statusText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching notification:', error);
    return null;
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise<boolean>}
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const response = await putAuthApi(`notifications/${notificationId}/read`);
    
    if (!response.ok) {
      console.error('Failed to mark notification as read:', response.status, response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for the current user's business
 * @returns {Promise<boolean>}
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const response = await putAuthApi('notification/read-all');
    
    if (!response.ok) {
      console.error('Failed to mark all notifications as read:', response.status, response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Delete a notification
 * @param {string} notificationId - The notification ID
 * @returns {Promise<boolean>}
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const response = await deleteAuthApi(`notifications/${notificationId}`);
    
    if (!response.ok) {
      console.error('Failed to delete notification:', response.status, response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

/**
 * Get unread notification count for the current user's business
 * @returns {Promise<number>}
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const response = await fetchAuthApi('notification/unread-count');
    
    if (!response.ok) {
      console.error('Failed to fetch unread count:', response.status, response.statusText);
      return 0;
    }
    
    const data = await response.json();
    return data.unreadCount || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Update a notification
 * @param {string} notificationId - The notification ID
 * @param {Partial<Notification>} updateData - The update data
 * @returns {Promise<Notification | null>}
 */
export async function updateNotification(
  notificationId: string, 
  updateData: Partial<Notification>
): Promise<Notification | null> {
  try {
    const response = await putAuthApi(`notifications/${notificationId}`, {}, JSON.stringify(updateData));
    
    if (!response.ok) {
      console.error('Failed to update notification:', response.status, response.statusText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating notification:', error);
    return null;
  }
}
