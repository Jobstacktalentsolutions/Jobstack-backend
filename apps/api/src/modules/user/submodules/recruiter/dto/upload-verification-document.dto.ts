import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RecruiterDocumentType } from '@app/common/shared/enums/recruiter-docs.enum';

export class UploadVerificationDocumentDto {
  @IsEnum(RecruiterDocumentType)
  documentType: RecruiterDocumentType;

  @IsOptional()
  @IsString()
  documentNumber?: string;
}
