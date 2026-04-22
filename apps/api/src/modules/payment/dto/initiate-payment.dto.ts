import { IsUUID, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({ example: 'c3b2b0c8-1a23-4f6e-9a8b-1234567890ab' })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({
    example: 'https://app.jobstack.ng/payment/callback',
  })
  @IsOptional()
  @IsUrl()
  callbackUrl?: string;
}
