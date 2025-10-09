import {
  Controller,
  Get,
  Put,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminJwtGuard } from 'apps/api/src/guards';
import { AdminService } from './admin.service';
import { UserRole } from '@app/common/shared/enums';

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get admin profile
   */
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    return this.adminService.getAdminProfile(user.sub);
  }

  /**
   * Update admin profile
   */
  @Put('profile')
  async updateProfile(@Body() updateData: any, @Req() req: Request) {
    const user = (req as any).user as { sub: string };
    return this.adminService.updateAdminProfile(user.sub, updateData);
  }

  /**
   * Get all admins (super admin only)
   */
  @Get('all')
  async getAllAdmins(@Req() req: Request) {
    const user = (req as any).user as { sub: string; role: UserRole };

    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can view all admins');
    }

    return this.adminService.getAllAdmins(user.sub);
  }

  /**
   * Get system overview (super admin only)
   */
  @Get('system-overview')
  async getSystemOverview(@Req() req: Request) {
    const user = (req as any).user as { sub: string; role: UserRole };

    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can view system overview',
      );
    }

    return this.adminService.getSystemOverview(user.sub);
  }

  /**
   * Check admin permissions
   */
  @Get('permissions')
  async getPermissions(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    const admin = await this.adminService.getAdminProfile(user.sub);
    return {
      permissions: admin.permissions,
      role: admin.role,
    };
  }
}
