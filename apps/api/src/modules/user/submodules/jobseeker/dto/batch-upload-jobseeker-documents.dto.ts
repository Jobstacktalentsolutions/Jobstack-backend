import { IsEnum, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { JobseekerDocumentType } from '@app/common/shared/enums/jobseeker-docs.enum';

export enum JobseekerBatchDocumentType {
  CV = 'CV',
  ID_DOCUMENT = 'ID_DOCUMENT',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  PROFILE_PICTURE = 'PROFILE_PICTURE',
}

export class JobseekerDocumentMetadataDto {
  @ApiProperty({
    enum: JobseekerBatchDocumentType,
  })
  @IsEnum(JobseekerBatchDocumentType)
  type: JobseekerBatchDocumentType;

  @ApiPropertyOptional({
    enum: JobseekerDocumentType,
    description: 'Specific ID document type (only for ID_DOCUMENT)',
  })
  @IsOptional()
  @IsEnum(JobseekerDocumentType)
  idDocumentType?: JobseekerDocumentType;

  @ApiPropertyOptional({ description: 'ID document number (only for ID_DOCUMENT)' })
  @IsOptional()
  @IsString()
  idDocumentNumber?: string;

  @ApiProperty({ description: 'Original filename to match with uploaded files' })
  @IsString()
  originalName: string;
}

export class BatchUploadJobseekerDocumentsDto {
  @ApiProperty({ type: [JobseekerDocumentMetadataDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobseekerDocumentMetadataDto)
  metadata: JobseekerDocumentMetadataDto[];
}
