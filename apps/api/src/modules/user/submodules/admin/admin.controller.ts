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
import { ApprovalStatus, EmployerStatus } from '@app/common/database/entities/schema.enum';
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

  @Post('admins')
  @RequireAdminRole(AdminRole.SUPER_ADMIN.role)
  async createAdmin(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any,
  ) {
    const admin = await this.adminService.createAdmin(user.id, body);
    return { success: true, data: admin };
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

  @Patch('admins/:id/suspend')
  @RequireAdminRole(AdminRole.SUPER_ADMIN.role)
  async suspendAdmin(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') adminId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.suspendAdmin(user.id, adminId, reason);
  }

  @Patch('admins/:id/unsuspend')
  @RequireAdminRole(AdminRole.SUPER_ADMIN.role)
  async unsuspendAdmin(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') adminId: string,
  ) {
    return this.adminService.unsuspendAdmin(user.id, adminId);
  }

  @Get('all')
  async getAllAdmins(@CurrentUser() user: CurrentUserPayload) {
    const admins = await this.adminService.getAllAdmins(user.id);
    return { success: true, data: admins };
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

  // Activate employer account (requires verification to be APPROVED)
  @Patch('employers/:id/activate')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async activateEmployer(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') employerId: string,
  ) {
    return this.adminService.updateEmployerStatus(user.id, employerId, EmployerStatus.ACTIVE);
  }

  // Deactivate employer account
  @Patch('employers/:id/deactivate')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async deactivateEmployer(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') employerId: string,
  ) {
    return this.adminService.updateEmployerStatus(user.id, employerId, EmployerStatus.INACTIVE);
  }

  // Suspend employer account (Operations & Support handles user management)
  @Patch('employers/:id/suspend')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async suspendEmployer(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') employerId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.updateEmployerStatus(user.id, employerId, EmployerStatus.SUSPENDED, reason);
  }

  // Unsuspend employer account (sets back to INACTIVE)
  @Patch('employers/:id/unsuspend')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async unsuspendEmployer(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') employerId: string,
  ) {
    return this.adminService.updateEmployerStatus(user.id, employerId, EmployerStatus.INACTIVE);
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

  // Approve jobseeker verification
  @Patch('jobseekers/:id/verification/approve')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async approveJobseeker(@Param('id') jobseekerId: string) {
    return this.adminService.updateJobseekerVerification(
      jobseekerId,
      ApprovalStatus.APPROVED,
    );
  }

  // Reject jobseeker verification
  @Patch('jobseekers/:id/verification/reject')
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  async rejectJobseeker(@Param('id') jobseekerId: string) {
    return this.adminService.updateJobseekerVerification(
      jobseekerId,
      ApprovalStatus.REJECTED,
    );
  }
}
