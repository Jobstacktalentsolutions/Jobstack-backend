import { IsEnum, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EmployerDocumentType } from '@app/common/shared/enums/employer-docs.enum';
import { GovernmentIdType } from '@app/common/shared/enums/employer-docs.enum';

export class DocumentMetadataDto {
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

  @ApiProperty({ description: 'Original filename to match with uploaded files' })
  @IsString()
  originalName: string;
}

export class BatchUploadVerificationDocumentDto {
  @ApiProperty({ type: [DocumentMetadataDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentMetadataDto)
  metadata: DocumentMetadataDto[];
}
