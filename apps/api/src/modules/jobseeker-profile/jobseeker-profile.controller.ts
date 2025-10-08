import {
  Controller,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';
import { JobseekerProfileService } from './jobseeker-profile.service';
import type { MulterFile } from '@app/common/shared/types';

@Controller('jobseeker/profile/cv')
export class JobseekerProfileController {
  constructor(protected readonly profileService: JobseekerProfileService) {}

  // Upload CV PDF for authenticated jobseeker
  @Post('upload')
  @UseGuards(JobSeekerJwtGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadCv(@UploadedFile() file: MulterFile, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const user = (req as any).user as { sub: string };
    const result = await this.profileService.uploadCv(user.sub, file);
    return { success: true, cvUrl: result.cvUrl };
  }

  // Delete CV for authenticated jobseeker
  @Delete()
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCv(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    await this.profileService.deleteCv(user.sub);
    return;
  }
}
