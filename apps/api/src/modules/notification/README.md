# Notification Module

This module provides email notification functionality with Bull queue processing and Brevo email provider integration.

## Features

- **Email Notifications**: Send templated emails via Brevo
- **App Notifications**: Store in-app notifications in database
- **Queue Processing**: Uses Bull/Redis for reliable email delivery
- **Provider Fallback**: Extensible provider system with retry logic
- **Template System**: EJS-based email templates
- **Database Persistence**: Track notification status and history

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Redis (for Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration (Brevo)
BREVO_API_KEY=your_brevo_api_key_here
BREVO_FROM_EMAIL=noreply@jobstack.ng
BREVO_FROM_NAME=JobStack

# Company Information
COMPANY_NAME=JobStack
SUPPORT_EMAIL=support@jobstack.ng
WEBSITE_URL=https://jobstack.ng
```

### 2. Database Migration

The `Notification` entity needs to be added to your database. Run migrations after importing the module.

### 3. Module Import

Import the `NotificationModule` in your main app module:

```typescript
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    // ... other imports
    NotificationModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
  ],
})
export class AppModule {}
```

## Usage Examples

### Send Email Notification

```typescript
import { NotificationService } from './notification/notification.service';
import { EmailTemplateType } from './notification/email/email-notification.enum';

@Injectable()
export class UserService {
  constructor(private notificationService: NotificationService) {}

  async welcomeNewUser(userId: string, userType: 'jobseeker' | 'recruiter', email: string, firstName: string) {
    await this.notificationService.sendEmailNotification(
      userId,
      userType,
      {
        recipient: email,
        templateType: EmailTemplateType.WELCOME,
        context: {
          firstName,
          userType,
        },
      }
    );
  }
}
```

### Send App Notification

```typescript
await this.notificationService.sendAppNotification(
  userId,
  'jobseeker',
  {
    title: 'New Job Match',
    message: 'We found a job that matches your profile!',
    metadata: {
      jobId: 'job-123',
      matchScore: 95,
    },
  }
);
```

### Get User Notifications

```typescript
const notifications = await this.notificationService.getUserNotifications(
  userId,
  'jobseeker',
  {
    page: 1,
    limit: 20,
    isRead: false, // Only unread notifications
  }
);
```

## API Endpoints

### POST /notifications/email
Send an email notification

```json
{
  "userId": "user-123",
  "userType": "jobseeker",
  "emailData": {
    "recipient": "user@example.com",
    "templateType": "welcome",
    "context": {
      "firstName": "John",
      "userType": "jobseeker"
    }
  },
  "priority": 3
}
```

### POST /notifications/app
Send an app notification

```json
{
  "userId": "user-123",
  "userType": "jobseeker",
  "title": "Welcome to JobStack",
  "message": "Your account has been created successfully!",
  "metadata": {
    "category": "account"
  }
}
```

### GET /notifications/:userType/:userId
Get user notifications with pagination

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `isRead`: Filter by read status (optional)
- `search`: Search in title/message (optional)

### GET /notifications/:userType/:userId/unread-count
Get unread notification count

### PATCH /notifications/:userType/:userId/:notificationId/read
Mark notification as read

### PATCH /notifications/:userType/:userId/read-all
Mark all notifications as read

## Email Templates

Templates are stored in `apps/api/src/templates/emails/` and use EJS syntax.

Available template variables:
- `companyName`: Company name from config
- `supportEmail`: Support email from config
- `websiteUrl`: Website URL from config
- `currentYear`: Current year
- `subject`: Email subject
- Plus any variables passed in the `context` object

### Available Templates

- `welcome.ejs`: Welcome new users
- `general-notification.ejs`: Generic notification template
- Add more templates as needed in the `EmailTemplateType` enum

## Queue Processing

Email notifications are processed asynchronously using Bull queues with:
- 3 retry attempts
- Exponential backoff (2s base delay)
- Automatic cleanup of completed/failed jobs

## Provider System

The module uses a provider fallback system. Currently only Brevo is implemented, but you can easily add more email providers by:

1. Creating a new provider class implementing `INotificationTransporter<EmailPayloadDto>`
2. Adding it to the `ALL_NOTIFICATION_PROVIDERS` array in `notification.config.ts`
3. Updating the email providers factory

## Monitoring

Check the Bull dashboard or Redis to monitor queue status and failed jobs. All operations are logged with structured logging.
