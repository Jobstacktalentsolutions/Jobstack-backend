import { IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePaymentPercentageDto {
  @ApiProperty({
    description: 'Percentage of salary/contract fee charged upfront',
    example: 15,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiPropertyOptional({
    example: 'Q2 pricing adjustment',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
