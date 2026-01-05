import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Patch,
  Param,
  Post,
  Delete,
} from '@nestjs/common';
import { AdminJwtGuard, RequireAdminRole } from 'apps/api/src/guards';
import { AdminService } from './admin.service';
import { VerificationStatus } from '@app/common/shared/enums/employer-docs.enum';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('me')
  async getMyProfile(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.adminService.getAdminProfile(user.id);
    return { success: true, profile: result };
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.adminService.getAdminProfile(user.id);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateData: any,
  ) {
    return this.adminService.updateAdminProfile(user.id, updateData);
  }

  // Create a new admin (requires SUPER_ADMIN role)
  @Post('admins')
  @RequireAdminRole(AdminRole.SUPER_ADMIN.role)
  async createAdmin(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any,
  ) {
    return this.adminService.createAdmin(user.id, body);
  }

  // Delete an admin (requires SUPER_ADMIN or higher privilege)
  @Delete('admins/:id')
  @RequireAdminRole(AdminRole.SUPER_ADMIN.role)
  async deleteAdmin(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') adminId: string,
  ) {
    return this.adminService.deleteAdmin(user.id, adminId);
  }

  @Get('all')
  async getAllAdmins(@CurrentUser() user: CurrentUserPayload) {
    return this.adminService.getAllAdmins(user.id);
  }

  @Get('system-overview')
  async getSystemOverview(@CurrentUser() user: CurrentUserPayload) {
    return this.adminService.getSystemOverview(user.id);
  }

  // Approve employer verification (Operations & Support handles new employer accounts)
  @Patch('employers/:id/verification/approve')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async approveEmployer(@Param('id') employerId: string) {
    return this.adminService.updateEmployerVerification(
      employerId,
      VerificationStatus.APPROVED,
    );
  }

  // Reject employer verification (Operations & Support handles new employer accounts)
  @Patch('employers/:id/verification/reject')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async rejectEmployer(
    @Param('id') employerId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.updateEmployerVerification(
      employerId,
      VerificationStatus.REJECTED,
      reason,
    );
  }

  // Suspend employer account (Operations & Support handles user management)
  @Patch('employers/:id/suspend')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async suspendEmployer(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') employerId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.suspendEmployer(user.id, employerId, reason);
  }

  // Unsuspend employer account
  @Patch('employers/:id/unsuspend')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async unsuspendEmployer(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') employerId: string,
  ) {
    return this.adminService.unsuspendEmployer(user.id, employerId);
  }

  // Suspend jobseeker account (Operations & Support handles user management)
  @Patch('jobseekers/:id/suspend')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async suspendJobseeker(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') jobseekerId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.suspendJobseeker(user.id, jobseekerId, reason);
  }

  // Unsuspend jobseeker account
  @Patch('jobseekers/:id/unsuspend')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async unsuspendJobseeker(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') jobseekerId: string,
  ) {
    return this.adminService.unsuspendJobseeker(user.id, jobseekerId);
  }
}
