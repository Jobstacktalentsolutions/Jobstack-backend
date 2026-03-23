import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsPhoneNumber,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WorkExperienceDto } from './work-experience.dto';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Chidi' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Nwosu' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Senior Software Engineer' })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional({
    example: 'Backend engineer focused on TypeScript and PostgreSQL.',
  })
  @IsString()
  @IsOptional()
  brief?: string;

  @ApiPropertyOptional({ example: '+2348099988776' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Lagos, Nigeria' })
  @IsString()
  @IsOptional()
  preferredLocation?: string;

  @ApiPropertyOptional({ example: '15 Allen Avenue' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Ikeja' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['NestJS', 'PostgreSQL'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  skillIds?: string[];

  @ApiPropertyOptional({ example: 300000 })
  @IsOptional()
  minExpectedSalary?: number;

  @ApiPropertyOptional({ example: 600000 })
  @IsOptional()
  maxExpectedSalary?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    type: [WorkExperienceDto],
    description: 'Array of work experience entries',
    example: [
      {
        company: 'Fashion Hub Ltd.',
        role: 'Sales Assistant',
        duration: 'Jan 2022 - Present',
        description:
          'Managing customer inquiries, processing sales transactions, and maintaining store inventory. Achieved 95% customer satisfaction rating.',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceDto)
  workExperience?: WorkExperienceDto[];
}
