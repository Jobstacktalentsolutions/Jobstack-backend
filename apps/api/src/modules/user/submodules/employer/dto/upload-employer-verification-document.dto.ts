import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployerDocumentType } from '@app/common/shared/enums/employer-docs.enum';

export class UploadEmployerVerificationDocumentDto {
  @ApiProperty({
    enum: EmployerDocumentType,
    example: EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
  })
  @IsEnum(EmployerDocumentType)
  documentType: EmployerDocumentType;

  @ApiPropertyOptional({ example: 'RC-123456' })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}
