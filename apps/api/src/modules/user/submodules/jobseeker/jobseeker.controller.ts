import {
  Controller,
  Post,
  Delete,
  Put,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Body,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JobSeekerJwtGuard, AdminJwtGuard } from 'apps/api/src/guards';
import { JobseekerService } from './jobseeker.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetAllJobSeekersQueryDto } from './dto/get-all-jobseekers-query.dto';
import type { MulterFile } from '@app/common/shared/types';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';

@Controller('/user/jobseeker')
export class JobseekerController {
  constructor(protected readonly jobseekerService: JobseekerService) {}

  // Upload CV PDF for authenticated jobseeker
  @Post('profile/cv')
  @UseGuards(JobSeekerJwtGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadCv(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const result = await this.jobseekerService.uploadCv(user.id, file);
    return {
      success: true,
      cvUrl: result.cvUrl,
      documentId: result.documentId,
    };
  }

  // Delete CV for authenticated jobseeker
  @Delete('profile/cv')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCv(@CurrentUser() user: CurrentUserPayload) {
    await this.jobseekerService.deleteCv(user.id);
    return;
  }

  // Get CV document with signed URL
  @Get('profile/cv')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getCvDocument(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.jobseekerService.getCvDocument(user.id);
    if (!result) {
      throw new BadRequestException('No CV document found');
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

  // Upload profile picture for authenticated jobseeker
  @Post('profile/picture')
  @UseGuards(JobSeekerJwtGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadProfilePicture(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const result = await this.jobseekerService.uploadProfilePicture(
      user.id,
      file,
    );
    return {
      success: true,
      pictureUrl: result.pictureUrl,
      documentId: result.documentId,
    };
  }

  // Delete profile picture for authenticated jobseeker
  @Delete('profile/picture')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfilePicture(@CurrentUser() user: CurrentUserPayload) {
    await this.jobseekerService.deleteProfilePicture(user.id);
    return;
  }

  // Get profile picture document with signed URL
  @Get('profile/picture')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getProfilePicture(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.jobseekerService.getProfilePicture(user.id);
    if (!result) {
      throw new BadRequestException('No profile picture found');
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

  // Update jobseeker profile
  @Put('profile')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const result = await this.jobseekerService.updateProfile(
      user.id,
      updateProfileDto,
    );
    return { success: true, profile: result };
  }

  // Get current user's profile (me route)
  @Get('me')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.jobseekerService.getProfile(user.id);
    console.log('result', result);
    return { success: true, data: result };
  }

  // Admin routes for managing job seekers (paginated)
  @Get('admin/all')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getAllJobSeekers(
    @CurrentUser() admin: CurrentUserPayload,
    @Query() query: GetAllJobSeekersQueryDto,
  ) {
    const result = await this.jobseekerService.getAllJobSeekers(admin.id, query);
    return { success: true, ...result };
  }

  @Get('admin/:id')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getJobSeekerById(
    @CurrentUser() admin: CurrentUserPayload,
    @Param('id') jobSeekerId: string,
  ) {
    const result = await this.jobseekerService.getJobSeekerById(
      jobSeekerId,
      admin.id,
    );
    return { success: true, jobSeeker: result };
  }
}
