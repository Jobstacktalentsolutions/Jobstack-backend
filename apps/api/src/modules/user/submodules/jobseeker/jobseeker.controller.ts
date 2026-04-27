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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JobSeekerJwtGuard, AdminJwtGuard } from 'apps/api/src/guards';
import { JobseekerService } from './jobseeker.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetAllJobSeekersQueryDto } from './dto/get-all-jobseekers-query.dto';
import type { MulterFile } from '@app/common/shared/types';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';
import { JobseekerDocumentType } from '@app/common/shared/enums/jobseeker-docs.enum';
import { EmployerService } from '../employer/employer.service';

@ApiTags('Users (jobseeker)')
@ApiBearerAuth()
@Controller('/user/jobseeker')
export class JobseekerController {
  constructor(
    protected readonly jobseekerService: JobseekerService,
    protected readonly employerService: EmployerService,
  ) {}

  // Upload CV PDF for authenticated jobseeker
  @Post('profile/cv')
  @UseGuards(JobSeekerJwtGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload CV PDF' })
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
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile picture' })
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

  @Post('profile/id-document')
  @UseGuards(JobSeekerJwtGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload ID document (NIN/Passport/Drivers license/Voters card)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        idDocumentType: {
          type: 'string',
          enum: ['NIN', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD'],
        },
        idDocumentNumber: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['idDocumentType', 'idDocumentNumber', 'file'],
    },
  })
  async uploadIdDocument(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: MulterFile,
    @Body('idDocumentType') idDocumentType: JobseekerDocumentType,
    @Body('idDocumentNumber') idDocumentNumber: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.jobseekerService.uploadIdDocument(
      user.id,
      file,
      idDocumentType,
      idDocumentNumber,
    );

    return {
      success: true,
      signedUrl: result.signedUrl,
      documentId: result.documentId,
    };
  }

  @Get('profile/id-document')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getIdDocument(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.jobseekerService.getIdDocument(user.id);
    if (!result) {
      throw new BadRequestException('No ID document found');
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
      idDocumentType: result.idDocumentType,
      idDocumentNumber: result.idDocumentNumber,
      idDocumentVerified: result.idDocumentVerified,
      idDocumentStatus: result.idDocumentStatus,
    };
  }

  @Delete('profile/id-document')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteIdDocument(@CurrentUser() user: CurrentUserPayload) {
    await this.jobseekerService.deleteIdDocument(user.id);
    return;
  }

  @Post('profile/proof-of-address')
  @UseGuards(JobSeekerJwtGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload proof of address document (utility bill not older than 3 months)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  async uploadProofOfAddress(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.jobseekerService.uploadProofOfAddress(
      user.id,
      file,
    );

    return {
      success: true,
      signedUrl: result.signedUrl,
      documentId: result.documentId,
    };
  }

  @Get('profile/proof-of-address')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async getProofOfAddress(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.jobseekerService.getProofOfAddress(user.id);
    if (!result) {
      throw new BadRequestException('No proof of address document found');
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
      proofOfAddressVerified: result.proofOfAddressVerified,
      proofOfAddressStatus: result.proofOfAddressStatus,
    };
  }

  @Delete('profile/proof-of-address')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProofOfAddress(@CurrentUser() user: CurrentUserPayload) {
    await this.jobseekerService.deleteProofOfAddress(user.id);
    return;
  }

  // Update jobseeker profile
  @Put('profile')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update jobseeker profile' })
  @ApiBody({ type: UpdateProfileDto })
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
    const result = await this.jobseekerService.getAllJobSeekers(
      admin.id,
      query,
    );
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

  @Get('employers/:id')
  @UseGuards(JobSeekerJwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get employer profile for jobseeker' })
  async getEmployerProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') employerId: string,
  ) {
    const result = await this.employerService.getEmployerProfileForJobseeker(
      employerId,
      user.id,
    );
    return { success: true, data: result };
  }
}
