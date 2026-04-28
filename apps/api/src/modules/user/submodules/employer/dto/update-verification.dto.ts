import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployerType } from '@app/common/database/entities/schema.enum';

export class UpdateVerificationInfoDto {
  @ApiPropertyOptional({ example: 'Acme Technologies Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: '12 Admiralty Way, Lekki Phase 1' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '11–50' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ example: 'https://acme.ng' })
  @IsOptional()
  @IsString()
  socialOrWebsiteUrl?: string;

  @ApiPropertyOptional({ example: 'https://acme.ng/company' })
  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @ApiPropertyOptional({ example: 'We hire vetted support staff and admins.' })
  @IsOptional()
  @IsString()
  companyDescription?: string;

  @ApiPropertyOptional({ enum: EmployerType, example: EmployerType.SME })
  @IsOptional()
  @IsEnum(EmployerType)
  type?: EmployerType;
}
