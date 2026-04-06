import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobApplicationDto {

  @ApiPropertyOptional({
    description: 'Short note to the employer',
    example:
      'I have 5 years of NestJS experience and am available immediately.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
