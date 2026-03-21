import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '@app/common/shared/enums/employer-docs.enum';

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
  @ApiProperty({ description: 'Mark document as verified', example: true })
  @IsBoolean()
  verified: boolean;
}
