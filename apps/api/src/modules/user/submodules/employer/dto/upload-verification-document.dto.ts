import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EmployerDocumentType } from '@app/common/shared/enums/employer-docs.enum';

export class UploadEmployerVerificationDocumentDto {
  @IsEnum(EmployerDocumentType)
  documentType: EmployerDocumentType;

  @IsOptional()
  @IsString()
  documentNumber?: string;
}
