import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { VerificationStatus } from '@app/common/shared/enums/recruiter-docs.enum';

export class UpdateVerificationStatusDto {
  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class UpdateDocumentVerificationDto {
  @IsBoolean()
  verified: boolean;
}
