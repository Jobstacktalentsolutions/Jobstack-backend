import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO for updating the number of highlighted candidates on a job
export class AdjustHighlightedCountDto {
  @ApiProperty({
    description: 'Number of highlighted candidates (1–10)',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  count: number;
}
