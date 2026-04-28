import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployerDocumentType } from '@app/common/shared/enums/employer-docs.enum';
import { GovernmentIdType } from '@app/common/shared/enums/employer-docs.enum';

export class UploadEmployerVerificationDocumentDto {
  @ApiProperty({
    enum: EmployerDocumentType,
    example: EmployerDocumentType.CAC_REGISTRATION_CERTIFICATE,
  })
  @IsEnum(EmployerDocumentType)
  documentType: EmployerDocumentType;

  @ApiPropertyOptional({ example: 'RC-123456' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({
    enum: GovernmentIdType,
    example: GovernmentIdType.NIN_SLIP,
  })
  @IsOptional()
  @IsEnum(GovernmentIdType)
  governmentIdType?: GovernmentIdType;
}
