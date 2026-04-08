import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployerType, EmployerStatus } from '@app/common/database/entities/schema.enum';
import { VerificationStatus } from '@app/common/shared/enums/employer-docs.enum';

export class GetAllEmployersQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: EmployerType, example: EmployerType.SME })
  @IsOptional()
  @IsEnum(EmployerType)
  type?: EmployerType;

  @ApiPropertyOptional({
    enum: VerificationStatus,
    example: VerificationStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({
    enum: EmployerStatus,
    example: EmployerStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EmployerStatus)
  status?: EmployerStatus;

  @ApiPropertyOptional({
    description: 'Search by name, email, or company name',
    example: 'acme',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'],
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], example: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
