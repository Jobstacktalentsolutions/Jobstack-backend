import {
  Controller,
  Get,
  Put,
  Body,
  Req,
  UseGuards,
  Patch,
  Param,
  Post,
  Delete,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminJwtGuard, RequireAdminRole } from 'apps/api/src/guards';
import { AdminService } from './admin.service';
import { VerificationStatus } from '@app/common/shared/enums/recruiter-docs.enum';
import { AdminRole } from '@app/common/shared/enums/roles.enum';

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('me')
  async getMyProfile(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    const result = await this.adminService.getAdminProfile(user.sub);
    return { success: true, profile: result };
  }

  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    return this.adminService.getAdminProfile(user.sub);
  }

  @Put('profile')
  async updateProfile(@Body() updateData: any, @Req() req: Request) {
    const user = (req as any).user as { sub: string };
    return this.adminService.updateAdminProfile(user.sub, updateData);
  }

  // Create a new admin (requires USER_MANAGEMENT role or higher privilege)
  @Post('admins')
  @RequireAdminRole(AdminRole.USER_MANAGEMENT.role)
  async createAdmin(@Req() req: Request, @Body() body: any) {
    const user = (req as any).user as { sub: string };
    return this.adminService.createAdmin(user.sub, body);
  }

  // Delete an admin (requires SUPER_ADMIN or higher privilege)
  @Delete('admins/:id')
  @RequireAdminRole(AdminRole.SUPER_ADMIN.role)
  async deleteAdmin(@Req() req: Request, @Param('id') adminId: string) {
    const user = (req as any).user as { sub: string };
    return this.adminService.deleteAdmin(user.sub, adminId);
  }

  @Get('all')
  async getAllAdmins(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    return this.adminService.getAllAdmins(user.sub);
  }

  @Get('system-overview')
  async getSystemOverview(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    return this.adminService.getSystemOverview(user.sub);
  }

  @Patch('recruiters/:id/verification/approve')
  async approveRecruiter(@Param('id') recruiterId: string) {
    return this.adminService.updateRecruiterVerification(
      recruiterId,
      VerificationStatus.APPROVED,
    );
  }

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
