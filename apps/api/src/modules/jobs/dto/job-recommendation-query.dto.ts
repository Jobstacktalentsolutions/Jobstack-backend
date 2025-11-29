import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class JobRecommendationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}

