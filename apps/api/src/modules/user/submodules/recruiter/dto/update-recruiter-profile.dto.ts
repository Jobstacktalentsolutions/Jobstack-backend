import { RecruiterType } from '@app/common/database/entities/schema.enum';
import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  MinLength,
  IsEnum,
} from 'class-validator';

export class UpdateRecruiterProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;


  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsEnum(RecruiterType)
  @IsOptional()
  type?: RecruiterType;
}
