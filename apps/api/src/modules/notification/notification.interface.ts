/**
 * Response for sending notifications
 */
export interface NotificationResponse {
  success: boolean; // Whether the notification was actually sent/queued
  message: string;
  notificationId?: string;
  skippedReason?: string; // Reason why notification was skipped (if applicable)
}

export interface INotificationTransporter<T> {
  send(payload: T): Promise<void>;
}

/**
 * Query parameters for fetching app notifications
 */
export interface AppNotificationQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
  search?: string;
}
