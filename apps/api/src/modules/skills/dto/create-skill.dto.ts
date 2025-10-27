import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { SkillStatus } from '@app/common/database/entities/schema.enum';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  synonyms?: string[];
}
