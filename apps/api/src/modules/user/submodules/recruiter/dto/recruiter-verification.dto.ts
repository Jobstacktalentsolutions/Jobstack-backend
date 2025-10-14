import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { RecruiterDocumentType } from '@app/common/shared/enums/recruiter-docs.enum';
import { RecruiterType } from 'apps/api/src/modules/auth/submodules/recruiter/dto/recruiter-auth.dto';

// Verification submission DTO
export class RecruiterVerificationDto {
  @IsEnum(RecruiterType)
  submissionType: RecruiterType; // INDIVIDUAL or ORGANIZATION

  @IsEnum(RecruiterDocumentType)
  documentType: RecruiterDocumentType;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.submissionType === RecruiterType.ORGANIZATION)
  documentNumber?: string; // Required for most CAC docs, validated in service

  // Files are captured via multer interceptors; these fields hold keys for validation layer if needed
  // documentFile: required via interceptor guard
  // proofOfAddressFile: required for INDIVIDUAL via interceptor guard

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.submissionType === RecruiterType.ORGANIZATION)
  businessAddress?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.submissionType === RecruiterType.ORGANIZATION)
  tin?: string;
}
