import {
  Controller,
  Post,
  Delete,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Req,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';
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
    return { success: true, cvUrl: result.cvUrl };
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
}
