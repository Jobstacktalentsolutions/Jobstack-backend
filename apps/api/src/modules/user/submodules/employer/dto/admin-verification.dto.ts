import {
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '@app/common/shared/enums/employer-docs.enum';
import { VerificationDocumentStatus } from '@app/common/shared/enums/verification-document-status.enum';

export class UpdateVerificationStatusDto {
  @ApiProperty({
    enum: VerificationStatus,
    example: VerificationStatus.APPROVED,
  })
  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  @ApiPropertyOptional({
    example: 'CAC document image was unreadable.',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class UpdateDocumentVerificationDto {
  @ApiProperty({
    enum: VerificationDocumentStatus,
    example: VerificationDocumentStatus.APPROVED,
  })
  @IsEnum(VerificationDocumentStatus)
  status: VerificationDocumentStatus;

  @ApiPropertyOptional({
    example: 'Document was blurry or expired.',
  })
  @ValidateIf((o) => o.status === VerificationDocumentStatus.REJECTED)
  @IsNotEmpty()
  @IsString()
  rejectionReason?: string;
}
