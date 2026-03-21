import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplicantAcceptOfferDto {
  @ApiProperty({ description: 'Whether the candidate accepts the offer', example: true })
  @IsBoolean()
  accepted: boolean;

  @ApiPropertyOptional({ example: 'Happy to join on the proposed date.' })
  @IsOptional()
  @IsString()
  note?: string;
}
