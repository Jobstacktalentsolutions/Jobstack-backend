import {
  EmployerType,
  EmployerGender,
  SkillCategory,
} from '@app/common/database/entities/schema.enum';
import { GovernmentIdType } from '@app/common/shared/enums/employer-docs.enum';
import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  MinLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployerProfileDto {
  @ApiPropertyOptional({ example: 'Ada' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Okafor' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '12 Admiralty Way, Lekki',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ enum: EmployerType, example: EmployerType.SME })
  @IsEnum(EmployerType)
  @IsOptional()
  type?: EmployerType;

  @ApiPropertyOptional({ enum: EmployerGender, example: EmployerGender.FEMALE })
  @IsOptional()
  @IsEnum(EmployerGender)
  gender?: EmployerGender;

  @ApiPropertyOptional({
    enum: SkillCategory,
    example: SkillCategory.BUSINESS_ADMIN,
  })
  @IsOptional()
  @IsEnum(SkillCategory)
  industry?: SkillCategory;

  @ApiPropertyOptional({ example: 'Aisha Bello' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPersonName?: string;

  @ApiPropertyOptional({ example: 'HR Manager' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPersonJobTitle?: string;

  @ApiPropertyOptional({ example: 'hiring@acme.ng' })
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  workEmail?: string;

  @ApiPropertyOptional({ example: '12 Admiralty Way, Lekki, Lagos' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  registeredBusinessAddress?: string;

  @ApiPropertyOptional({
    enum: GovernmentIdType,
    example: GovernmentIdType.NIN_SLIP,
  })
  @IsOptional()
  @IsEnum(GovernmentIdType)
  governmentIdType?: GovernmentIdType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  declarationAccepted?: boolean;

  @ApiPropertyOptional({ example: 'Acme Technologies Ltd' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  companyName?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: '11-50' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  companySize?: string;

  @ApiPropertyOptional({ example: 'https://acme.ng' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  socialOrWebsiteUrl?: string;
}
