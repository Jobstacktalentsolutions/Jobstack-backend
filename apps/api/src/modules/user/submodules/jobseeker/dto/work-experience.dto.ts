import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    example: 'Jan 2022 - Present',
    description: 'Duration of employment (free-form text)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  duration: string;

  @ApiProperty({
    example:
      'Managing customer inquiries, processing sales transactions, and maintaining store inventory. Achieved 95% customer satisfaction rating.',
    description: 'Brief description of responsibilities and achievements',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;
}
