import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO for a single work experience entry
export class WorkExperienceDto {
  @ApiProperty({
    example: 'Fashion Hub Ltd.',
    description: 'Company or organization name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  company: string;

  @ApiProperty({
    example: 'Sales Assistant',
    description: 'Job role or position title',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  role: string;

  @ApiProperty({
    example: '2022-01-01',
    description: 'Start date of employment',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'End date of employment (null if current)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this is the current job',
  })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiProperty({
    example:
      'Managing customer inquiries, processing sales transactions, and maintaining store inventory. Achieved 95% customer satisfaction rating.',
    description: 'Brief description of responsibilities and achievements',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  description: string;

  @ApiPropertyOptional({
    example: 'Adeola Johnson',
    description: 'Name of a supervisor or HR contact for verification',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  referenceName?: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'Phone number of the reference contact',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referencePhone?: string;
}
