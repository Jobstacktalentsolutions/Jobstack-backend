import { IsInt, Max, Min } from 'class-validator';

// DTO for updating the number of highlighted candidates on a job
export class AdjustHighlightedCountDto {
  @IsInt()
  @Min(1)
  @Max(10)
  count: number;
}

