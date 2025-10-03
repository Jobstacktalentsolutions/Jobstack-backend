/**
 * Queues for notification delivery
 */
export const NotificationType = {
  EMAIL: 'email',
  APP: 'app',
} as const;

export enum NotificationPriority {
  LOW = 4,
  MEDIUM = 3,
  HIGH = 2,
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}
