import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RecruiterDocumentType } from '@app/common/shared/enums/recruiter-docs.enum';

// Verification submission DTO
// Note: recruiterType (INDIVIDUAL or ORGANIZATION) is now stored in RecruiterProfile.type
export class RecruiterVerificationDto {
  @IsEnum(RecruiterDocumentType)
  documentType: RecruiterDocumentType;

  @IsOptional()
  @IsString()
  documentNumber?: string; // Required for most CAC docs, validated in service

  // Files are captured via multer interceptors; these fields hold keys for validation layer if needed
  // documentFile: required via interceptor guard
  // proofOfAddressFile: required for INDIVIDUAL via interceptor guard

  @IsOptional()
  @IsString()
  businessAddress?: string;
}
