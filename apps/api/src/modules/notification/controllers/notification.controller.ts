import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { NotificationListQueryDto } from '../dto/notification-list-query.dto';
import { NotificationService } from '../notification.service';
import { RateLimit } from 'apps/api/src/guards';

@ApiTags('Notifications')
@RateLimit({ limit: 60, ttlSeconds: 60 })
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  private resolveCurrentUserId(user: CurrentUserPayload): string {
    return user.role === UserRole.ADMIN ? user.id : (user.profileId ?? user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my notifications' })
  async getUserNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: NotificationListQueryDto,
  ) {
    const userId = this.resolveCurrentUserId(user);

    const result = await this.notificationService.getUserNotifications(
      userId,
      user.role,
      query,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('me/unread-count')
  @ApiOperation({ summary: 'Get my unread notification count' })
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    const userId = this.resolveCurrentUserId(user);

    const count = await this.notificationService.getUnreadCount(
      userId,
      user.role,
    );

    return {
      success: true,
      data: { count },
    };
  }

  @Get('me/:notificationId')
  @ApiOperation({ summary: 'Get one of my notifications by ID' })
  async getNotificationById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('notificationId') notificationId: string,
  ) {
    const userId = this.resolveCurrentUserId(user);

    const notification = await this.notificationService.getNotificationById(
      notificationId,
      userId,
      user.role,
    );

    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: notification,
    };
  }

  @Patch('me/:notificationId/read')
  @ApiOperation({ summary: 'Mark one of my notifications as read' })
  async markNotificationAsRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('notificationId') notificationId: string,
  ) {
    const userId = this.resolveCurrentUserId(user);

    const success = await this.notificationService.markNotificationAsRead(
      notificationId,
      userId,
      user.role,
    );

    if (!success) {
      throw new HttpException(
        'Failed to mark notification as read or notification not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  @Patch('me/read-all')
  @ApiOperation({ summary: 'Mark all of my notifications as read' })
  async markAllNotificationsAsRead(@CurrentUser() user: CurrentUserPayload) {
    const userId = this.resolveCurrentUserId(user);

    const count = await this.notificationService.markAllNotificationsAsRead(
      userId,
      user.role,
    );

    return {
      success: true,
      message: `${count} notifications marked as read`,
      data: { count },
    };
  }
}
