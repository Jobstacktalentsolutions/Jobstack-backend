import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { NotificationService } from '../notification.service';

import type { AppNotificationQuery } from '../notification.interface';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get(':userType/:userId')
  async getUserNotifications(
    @Param('userId') userId: string,
    @Param('userType') userType: 'jobseeker' | 'recruiter' | 'admin',
    @Query() query: AppNotificationQuery,
  ) {
    if (!['jobseeker', 'recruiter', 'admin'].includes(userType)) {
      throw new HttpException(
        'Invalid userType. Must be jobseeker, recruiter, or admin',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.notificationService.getUserNotifications(
      userId,
      userType,
      query,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get(':userType/:userId/unread-count')
  async getUnreadCount(
    @Param('userId') userId: string,
    @Param('userType') userType: 'jobseeker' | 'recruiter' | 'admin',
  ) {
    if (!['jobseeker', 'recruiter', 'admin'].includes(userType)) {
      throw new HttpException(
        'Invalid userType. Must be jobseeker, recruiter, or admin',
        HttpStatus.BAD_REQUEST,
      );
    }

    const count = await this.notificationService.getUnreadCount(
      userId,
      userType,
    );

    return {
      success: true,
      data: { count },
    };
  }

  @Get(':userType/:userId/:notificationId')
  async getNotificationById(
    @Param('notificationId') notificationId: string,
    @Param('userId') userId: string,
    @Param('userType') userType: 'jobseeker' | 'recruiter' | 'admin',
  ) {
    if (!['jobseeker', 'recruiter', 'admin'].includes(userType)) {
      throw new HttpException(
        'Invalid userType. Must be jobseeker, recruiter, or admin',
        HttpStatus.BAD_REQUEST,
      );
    }

    const notification = await this.notificationService.getNotificationById(
      notificationId,
      userId,
      userType,
    );

    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: notification,
    };
  }

  @Patch(':userType/:userId/:notificationId/read')
  async markNotificationAsRead(
    @Param('notificationId') notificationId: string,
    @Param('userId') userId: string,
    @Param('userType') userType: 'jobseeker' | 'recruiter' | 'admin',
  ) {
    if (!['jobseeker', 'recruiter', 'admin'].includes(userType)) {
      throw new HttpException(
        'Invalid userType. Must be jobseeker, recruiter, or admin',
        HttpStatus.BAD_REQUEST,
      );
    }

    const success = await this.notificationService.markNotificationAsRead(
      notificationId,
      userId,
      userType,
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

  @Patch(':userType/:userId/read-all')
  async markAllNotificationsAsRead(
    @Param('userId') userId: string,
    @Param('userType') userType: 'jobseeker' | 'recruiter' | 'admin',
  ) {
    if (!['jobseeker', 'recruiter', 'admin'].includes(userType)) {
      throw new HttpException(
        'Invalid userType. Must be jobseeker, recruiter, or admin',
        HttpStatus.BAD_REQUEST,
      );
    }

    const count = await this.notificationService.markAllNotificationsAsRead(
      userId,
      userType,
    );

    return {
      success: true,
      message: `${count} notifications marked as read`,
      data: { count },
    };
  }
}
