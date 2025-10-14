import {
  Controller,
  Get,
  Post,
  Patch,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  Body,
  Req,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { RecruiterJwtGuard } from 'apps/api/src/guards';
import { RecruiterVerificationService } from './recruiter-verification.service';
import { RecruiterVerificationDto } from './dto/recruiter-verification.dto';
import { MulterFile } from '@app/common/shared/types';
@Controller('recruiters/me/verification')
@UseGuards(RecruiterJwtGuard)
export class RecruiterVerificationController {
  constructor(
    private readonly verificationService: RecruiterVerificationService,
  ) {}

  @Get()
  async getMine(@Req() req: Request) {
    const user = (req as any).user as { sub: string };
    return this.verificationService.getMyVerification(user.sub);
  }

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async submit(
    @Req() req: Request,
    @UploadedFiles() files: Array<MulterFile>,
    @Body() dto: RecruiterVerificationDto,
  ) {
    const user = (req as any).user as { sub: string };
    const fileMap = this.extractFiles(files);
    return this.verificationService.submitVerification(user.sub, dto, fileMap);
  }

  @Patch()
  @UseInterceptors(AnyFilesInterceptor())
  async resubmit(
    @Req() req: Request,
    @UploadedFiles() files: Array<MulterFile>,
    @Body() dto: RecruiterVerificationDto,
  ) {
    const user = (req as any).user as { sub: string };
    const fileMap = this.extractFiles(files);
    return this.verificationService.submitVerification(user.sub, dto, fileMap);
  }

  private extractFiles(files: Array<MulterFile>) {
    const doc = files?.find((f) => f.fieldname === 'documentFile');
    const proof = files?.find((f) => f.fieldname === 'proofOfAddressFile');
    return { documentFile: doc as any, proofOfAddressFile: proof as any };
  }
}
