import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'Paystack transaction reference',
    example: 'T123456789012345',
  })
  @IsString()
  @IsNotEmpty()
  reference: string;
}
