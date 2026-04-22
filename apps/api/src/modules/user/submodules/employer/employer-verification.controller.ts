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
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployerJwtGuard, AdminJwtGuard } from 'apps/api/src/guards';
import { EmployerVerificationService } from './employer-verification.service';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';
import {
  UploadVerificationDocumentDto,
  UpdateVerificationInfoDto,
  UuidParamDto,
  UpdateVerificationStatusDto,
  UpdateDocumentVerificationDto,
} from './dto';
import type { MulterFile } from '@app/common/shared/types';

@ApiTags('Employer verification')
@ApiBearerAuth()
@Controller('employers/verification')
@UseGuards(EmployerJwtGuard)
export class EmployerVerificationController {
  constructor(
    private readonly verificationService: EmployerVerificationService,
  ) {}

  // Get verification status
  @Get()
  async getMine(@CurrentUser() user: CurrentUserPayload) {
    return this.verificationService.getMyVerification(user.id);
  }

  // Update verification information
  @Put()
  @ApiOperation({ summary: 'Update company verification details' })
  @ApiBody({ type: UpdateVerificationInfoDto })
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

  // Get single verification document with signed URL
  @Get('documents/:id')
  async getDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param() params: UuidParamDto,
  ) {
    return this.verificationService.getMyVerificationDocumentWithSignedUrl(
      user.id,
      params.id,
    );
  }

  // Upload a single verification document
  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a verification document' })
  @ApiBody({ type: UploadVerificationDocumentDto })
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

  // Get document requirements for current employer type
  @Get('requirements')
  async getDocumentRequirements(@CurrentUser() user: CurrentUserPayload) {
    const employerProfile = await this.verificationService.getMyVerification(
      user.id,
    );
    if (!employerProfile?.type) {
      throw new BadRequestException('Employer type not set');
    }
    return this.verificationService.getDocumentRequirements(
      employerProfile.type,
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

// Admin routes for managing employer verification documents
@ApiTags('Employer verification (admin)')
@ApiBearerAuth()
@Controller('admin/employers/:employerId/verification')
@UseGuards(AdminJwtGuard)
export class AdminEmployerVerificationController {
  constructor(
    private readonly verificationService: EmployerVerificationService,
  ) {}

  // Get all verification documents for an employer
  @Get('documents')
  async getEmployerDocuments(@Param('employerId') employerId: string) {
    return this.verificationService.getEmployerVerificationDocuments(
      employerId,
    );
  }

  // Delete a verification document
  @Delete('documents/:id')
  async deleteDocument(@Param() params: UuidParamDto) {
    return this.verificationService.adminDeleteVerificationDocument(params.id);
  }

  // Update verification status
  @Put('status')
  @ApiOperation({ summary: 'Set employer verification status' })
  @ApiBody({ type: UpdateVerificationStatusDto })
  async updateVerificationStatus(
    @Param('employerId') employerId: string,
    @CurrentUser() admin: CurrentUserPayload,
    @Body() dto: UpdateVerificationStatusDto,
  ) {
    return this.verificationService.adminUpdateVerificationStatus(
      employerId,
      dto.status,
      admin.id,
      dto.rejectionReason,
    );
  }

  // Mark document as verified/unverified
  @Put('documents/:id/verify')
  @ApiOperation({ summary: 'Set per-document verification status' })
  @ApiBody({ type: UpdateDocumentVerificationDto })
  async updateDocumentVerification(
    @Param('id') documentId: string,
    @CurrentUser() admin: CurrentUserPayload,
    @Body() dto: UpdateDocumentVerificationDto,
  ) {
    return this.verificationService.adminUpdateDocumentVerification(
      documentId,
      dto,
      admin.id,
    );
  }
}
