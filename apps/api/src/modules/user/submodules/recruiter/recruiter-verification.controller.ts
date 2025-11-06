import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecruiterJwtGuard, AdminJwtGuard } from 'apps/api/src/guards';
import { RecruiterVerificationService } from './recruiter-verification.service';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';
import {
  UploadVerificationDocumentDto,
  UpdateVerificationInfoDto,
  UuidParamDto,
  UpdateVerificationStatusDto,
  UpdateDocumentVerificationDto,
} from './dto';
import type { MulterFile } from '@app/common/shared/types';

@Controller('recruiters/verification')
@UseGuards(RecruiterJwtGuard)
export class RecruiterVerificationController {
  constructor(
    private readonly verificationService: RecruiterVerificationService,
  ) {}

  // Get verification status
  @Get()
  async getMine(@CurrentUser() user: CurrentUserPayload) {
    return this.verificationService.getMyVerification(user.id);
  }

  // Update verification information
  @Put()
  async updateInfo(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateVerificationInfoDto,
  ) {
    return this.verificationService.updateVerificationInfo(user.id, dto);
  }

  // Get all verification documents
  @Get('documents')
  async getMyDocuments(@CurrentUser() user: CurrentUserPayload) {
    return this.verificationService.getMyVerificationDocuments(user.id);
  }

  // Upload a single verification document
  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: MulterFile,
    @Body() dto: UploadVerificationDocumentDto,
  ) {
    return this.verificationService.uploadVerificationDocument(
      user.id,
      dto,
      file,
    );
  }

  // Delete a verification document
  @Delete('documents/:id')
  async deleteDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param() params: UuidParamDto,
  ) {
    return this.verificationService.deleteVerificationDocument(
      user.id,
      params.id,
    );
  }

  // Get document requirements for current recruiter type
  @Get('requirements')
  async getDocumentRequirements(@CurrentUser() user: CurrentUserPayload) {
    const profile = await this.verificationService.getMyVerification(user.id);
    if (!profile?.recruiter?.type) {
      throw new BadRequestException('Recruiter type not set');
    }
    return this.verificationService.getDocumentRequirements(
      profile.recruiter.type,
    );
  }

  // Check auto-verification eligibility
  @Get('auto-verify/check')
  async checkAutoVerification(@CurrentUser() user: CurrentUserPayload) {
    return this.verificationService.checkAutoVerificationEligibility(user.id);
  }

  // Trigger auto-verification
  @Post('auto-verify')
  async performAutoVerification(@CurrentUser() user: CurrentUserPayload) {
    return this.verificationService.performAutoVerification(user.id);
  }
}

// Admin routes for managing recruiter verification documents
@Controller('admin/recruiters/:recruiterId/verification')
@UseGuards(AdminJwtGuard)
export class AdminRecruiterVerificationController {
  constructor(
    private readonly verificationService: RecruiterVerificationService,
  ) {}

  // Get all verification documents for a recruiter
  @Get('documents')
  async getRecruiterDocuments(@Param('recruiterId') recruiterId: string) {
    return this.verificationService.getRecruiterVerificationDocuments(
      recruiterId,
    );
  }

  // Delete a verification document
  @Delete('documents/:id')
  async deleteDocument(@Param() params: UuidParamDto) {
    return this.verificationService.adminDeleteVerificationDocument(params.id);
  }

  // Update verification status
  @Put('status')
  async updateVerificationStatus(
    @Param('recruiterId') recruiterId: string,
    @CurrentUser() admin: CurrentUserPayload,
    @Body() dto: UpdateVerificationStatusDto,
  ) {
    return this.verificationService.adminUpdateVerificationStatus(
      recruiterId,
      dto.status,
      admin.id,
      dto.rejectionReason,
    );
  }

  // Mark document as verified/unverified
  @Put('documents/:id/verify')
  async updateDocumentVerification(
    @Param() params: UuidParamDto,
    @CurrentUser() admin: CurrentUserPayload,
    @Body() dto: UpdateDocumentVerificationDto,
  ) {
    return this.verificationService.adminUpdateDocumentVerification(
      params.id,
      dto.verified,
      admin.id,
    );
  }
}
