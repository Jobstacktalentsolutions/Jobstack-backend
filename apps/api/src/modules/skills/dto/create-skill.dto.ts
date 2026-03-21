import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({ example: 'NestJS', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'Node.js framework for scalable server apps',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Node', 'TypeScript backend'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  synonyms?: string[];
}
