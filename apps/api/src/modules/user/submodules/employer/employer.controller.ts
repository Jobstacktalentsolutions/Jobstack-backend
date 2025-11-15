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
import { EmployerJwtGuard, AdminJwtGuard } from 'apps/api/src/guards';
import { EmployerService } from './employer.service';
import type { MulterFile } from '@app/common/shared/types';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';
import {
  UpdateEmployerProfileDto,
  GetAllEmployersQueryDto,
  UuidParamDto,
} from './dto';

@Controller('user/employer')
@UseGuards(EmployerJwtGuard)
export class EmployerController {
  constructor(private readonly employerService: EmployerService) {}

  /**
   * Get current user's profile (me route)
   */
  @Get('me')
  async getMyProfile(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.employerService.getEmployerProfile(user.id);
    return { success: true, profile: result };
  }

  /**
   * Update employer profile
   */
  @Put('profile')
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateData: UpdateEmployerProfileDto,
  ) {
    return this.employerService.updateEmployerProfile(user.id, updateData);
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
    const result = await this.employerService.uploadCompanyLogo(user.id, file);
    return { success: true, logoUrl: result.logoUrl };
  }

  /**
   * Delete company logo
   */
  @Delete('profile/company-logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCompanyLogo(@CurrentUser() user: CurrentUserPayload) {
    await this.employerService.deleteCompanyLogo(user.id);
    return;
  }

  /**
   * Get company logo with signed URL
   */
  @Get('profile/company-logo')
  @HttpCode(HttpStatus.OK)
  async getCompanyLogo(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.employerService.getCompanyLogo(user.id);
    if (!result) {
      throw new BadRequestException('No company logo found');
    }
    return {
      success: true,
      document: {
        id: result.document.id,
        fileName: result.document.fileName,
        originalName: result.document.originalName,
        mimeType: result.document.mimeType,
        size: result.document.size,
        type: result.document.type,
        description: result.document.description,
        createdAt: result.document.createdAt,
      },
      signedUrl: result.signedUrl,
    };
  }

  // Admin routes for managing employers
  @Get('admin/all')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getAllEmployers(
    @CurrentUser() admin: CurrentUserPayload,
    @Query() query: GetAllEmployersQueryDto,
  ) {
    const result = await this.employerService.getAllEmployers(admin.id, query);
    return { success: true, ...result };
  }

  @Get('admin/:id')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getEmployerById(
    @CurrentUser() admin: CurrentUserPayload,
    @Param() params: UuidParamDto,
  ) {
    const result = await this.employerService.getEmployerById(
      params.id,
      admin.id,
    );
    return { success: true, employer: result };
  }
}
