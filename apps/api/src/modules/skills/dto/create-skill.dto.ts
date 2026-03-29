import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillCategory } from '@app/common/database/entities/schema.enum';

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

export class AddSkillDto {
  @ApiProperty({ example: 'NestJS', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: SkillCategory, example: SkillCategory.SOFTWARE_DEVELOPMENT })
  @IsEnum(SkillCategory)
  category: SkillCategory;
}
