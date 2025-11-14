import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EmployerDocumentType } from '@app/common/shared/enums/employer-docs.enum';

// Verification submission DTO
// Note: employerType (INDIVIDUAL or ORGANIZATION) is now stored in EmployerProfile.type
export class EmployerVerificationDto {
  @IsEnum(EmployerDocumentType)
  documentType: EmployerDocumentType;

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
