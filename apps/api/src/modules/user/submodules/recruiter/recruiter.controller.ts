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
  HttpCode,
  HttpStatus,
  BadRequestException,
  Param,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecruiterJwtGuard, AdminJwtGuard } from 'apps/api/src/guards';
import { RecruiterService } from './recruiter.service';
import type { MulterFile } from '@app/common/shared/types';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';
import {
  UpdateRecruiterProfileDto,
  GetAllRecruitersQueryDto,
  UuidParamDto,
} from './dto';

@Controller('user/recruiter')
@UseGuards(RecruiterJwtGuard)
export class RecruiterController {
  constructor(private readonly recruiterService: RecruiterService) {}

  /**
   * Get current user's profile (me route)
   */
  @Get('me')
  async getMyProfile(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.recruiterService.getRecruiterProfile(user.id);
    return { success: true, profile: result };
  }

  /**
   * Get recruiter profile
   */
  @Get('profile')
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.recruiterService.getRecruiterProfile(user.id);
  }

  /**
   * Update recruiter profile
   */
  @Put('profile')
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateData: UpdateRecruiterProfileDto,
  ) {
    return this.recruiterService.updateRecruiterProfile(user.id, updateData);
  }

  /**
   * Upload company logo
   */
  @Post('profile/company-logo')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadCompanyLogo(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const result = await this.recruiterService.uploadCompanyLogo(user.id, file);
    return { success: true, logoUrl: result.logoUrl };
  }

  /**
   * Delete company logo
   */
  @Delete('profile/company-logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCompanyLogo(@CurrentUser() user: CurrentUserPayload) {
    await this.recruiterService.deleteCompanyLogo(user.id);
    return;
  }

  // Admin routes for managing recruiters
  @Get('admin/all')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getAllRecruiters(
    @CurrentUser() admin: CurrentUserPayload,
    @Query() query: GetAllRecruitersQueryDto,
  ) {
    const result = await this.recruiterService.getAllRecruiters(
      admin.id,
      query,
    );
    return { success: true, ...result };
  }

  @Get('admin/:id')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getRecruiterById(
    @CurrentUser() admin: CurrentUserPayload,
    @Param() params: UuidParamDto,
  ) {
    const result = await this.recruiterService.getRecruiterById(
      params.id,
      admin.id,
    );
    return { success: true, recruiter: result };
  }
}
