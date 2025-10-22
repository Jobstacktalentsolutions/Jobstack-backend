import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { RecruiterJwtGuard, AdminJwtGuard } from 'apps/api/src/guards';
import { RecruiterService } from './recruiter.service';
import type { MulterFile } from '@app/common/shared/types';

@Controller('recruiter')
@UseGuards(RecruiterJwtGuard)
export class RecruiterController {
  constructor(private readonly recruiterService: RecruiterService) {}

  /**
   * Get current user's profile (me route)
   */
  @Get('me')
  async getMyProfile(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    const result = await this.recruiterService.getRecruiterProfile(user.sub);
    return { success: true, profile: result };
  }

  /**
   * Get recruiter profile
   */
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    return this.recruiterService.getRecruiterProfile(user.sub);
  }

  /**
   * Update recruiter profile
   */
  @Put('profile')
  async updateProfile(@Body() updateData: any, @Req() req: Request) {
    const user = (req as any).user as { sub: string };
    return this.recruiterService.updateRecruiterProfile(user.sub, updateData);
  }

  /**
   * Upload company logo
   */
  @Post('profile/company-logo')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadCompanyLogo(
    @UploadedFile() file: MulterFile,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const user = (req as any).user as { sub: string };
    const result = await this.recruiterService.uploadCompanyLogo(
      user.sub,
      file,
    );
    return { success: true, logoUrl: result.logoUrl };
  }

  /**
   * Delete company logo
   */
  @Delete('profile/company-logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCompanyLogo(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    await this.recruiterService.deleteCompanyLogo(user.sub);
    return;
  }

  // Admin routes for managing recruiters
  @Get('admin/all')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getAllRecruiters(@Req() req: Request) {
    const admin = (req as any).user as { sub: string };
    const result = await this.recruiterService.getAllRecruiters(admin.sub);
    return { success: true, recruiters: result };
  }

  @Get('admin/:id')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getRecruiterById(
    @Param('id') recruiterId: string,
    @Req() req: Request,
  ) {
    const admin = (req as any).user as { sub: string };
    const result = await this.recruiterService.getRecruiterById(
      recruiterId,
      admin.sub,
    );
    return { success: true, recruiter: result };
  }
}
