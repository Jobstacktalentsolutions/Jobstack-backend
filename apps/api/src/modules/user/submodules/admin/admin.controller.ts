import {
  Controller,
  Get,
  Put,
  Body,
  Req,
  UseGuards,
  Patch,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminJwtGuard } from 'apps/api/src/guards';
import { AdminService } from './admin.service';
import { VerificationStatus } from '@app/common/shared/enums/recruiter-docs.enum';
import { UserRole } from '@app/common/shared/enums';

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get current user's profile (me route)
   */
  @Get('me')
  async getMyProfile(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    const result = await this.adminService.getAdminProfile(user.sub);
    return { success: true, profile: result };
  }

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

    return this.adminService.getAllAdmins(user.sub);
  }

  /**
   * Get system overview (super admin only)
   */
  @Get('system-overview')
  async getSystemOverview(@Req() req: Request) {
    const user = (req as any).user as { sub: string; role: UserRole };

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

  /**
   * Approve recruiter verification
   */
  @Patch('recruiters/:id/verification/approve')
  async approveRecruiter(@Param('id') recruiterId: string) {
    return this.adminService.updateRecruiterVerification(
      recruiterId,
      VerificationStatus.APPROVED,
    );
  }

  /**
   * Reject recruiter verification
   */
  @Patch('recruiters/:id/verification/reject')
  async rejectRecruiter(
    @Param('id') recruiterId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.updateRecruiterVerification(
      recruiterId,
      VerificationStatus.REJECTED,
      reason,
    );
  }
}
