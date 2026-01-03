import { IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentPercentageDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @IsOptional()
  @IsString()
  description?: string;
}
