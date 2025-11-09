import {
  Controller,
  Post,
  Delete,
  Put,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Req,
  Body,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JobSeekerJwtGuard, AdminJwtGuard } from 'apps/api/src/guards';
import { JobseekerService } from './jobseeker.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { MulterFile } from '@app/common/shared/types';

@Controller('/user/jobseeker')
export class JobseekerController {
  constructor(protected readonly jobseekerService: JobseekerService) {}

  // Upload CV PDF for authenticated jobseeker
  @Post('profile/cv')
  @UseGuards(JobSeekerJwtGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadCv(@UploadedFile() file: MulterFile, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const user = (req as any).user as { sub: string };
    const result = await this.jobseekerService.uploadCv(user.sub, file);
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
  async deleteCv(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    await this.jobseekerService.deleteCv(user.sub);
    return;
  }

  // Get CV document with signed URL
  @Get('profile/cv')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getCvDocument(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    const result = await this.jobseekerService.getCvDocument(user.sub);
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

  // Update jobseeker profile
  @Put('profile')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user as { sub: string };
    const result = await this.jobseekerService.updateProfile(
      user.sub,
      updateProfileDto,
    );
    return { success: true, profile: result };
  }

  // Get current user's profile (me route)
  @Get('me')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    const result = await this.jobseekerService.getProfile(user.sub);
    console.log('result', result);
    return { success: true, data: result };
  }

  // Admin routes for managing job seekers
  @Get('admin/all')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getAllJobSeekers(@Req() req: Request) {
    const admin = (req as any).user as { sub: string };
    const result = await this.jobseekerService.getAllJobSeekers(admin.sub);
    return { success: true, jobSeekers: result };
  }

  @Get('admin/:id')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getJobSeekerById(
    @Param('id') jobSeekerId: string,
    @Req() req: Request,
  ) {
    const admin = (req as any).user as { sub: string };
    const result = await this.jobseekerService.getJobSeekerById(
      jobSeekerId,
      admin.sub,
    );
    return { success: true, jobSeeker: result };
  }
}
