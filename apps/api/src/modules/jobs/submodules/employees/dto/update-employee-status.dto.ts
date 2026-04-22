import {
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EmployeeStatus,
  EmployeeTerminationHrMeaning,
} from '@app/common/database/entities/schema.enum';

/** @deprecated Import from schema.enum; re-exported for backward compatibility. */
export { EmployeeTerminationHrMeaning };

export class UpdateEmployeeStatusDto {
  @ApiProperty({ enum: EmployeeStatus, example: EmployeeStatus.ACTIVE })
  @IsEnum(EmployeeStatus)
  status: EmployeeStatus;

  @ApiProperty({
    enum: EmployeeTerminationHrMeaning,
    example: EmployeeTerminationHrMeaning.EMPLOYEE_RESIGNED,
    required: false,
  })
  @IsOptional()
  @IsEnum(EmployeeTerminationHrMeaning)
  hrMeaning?: EmployeeTerminationHrMeaning;

  @ApiProperty({
    required: false,
    example: 'Employee resigned due to relocation.',
  })
  @ValidateIf(
    (dto: UpdateEmployeeStatusDto) => dto.status === EmployeeStatus.TERMINATED,
  )
  @IsString()
  @IsNotEmpty()
  reasonForTermination?: string;

  @ApiProperty({
    description: 'Employer exit rating (1–5) when ending employment',
    minimum: 1,
    maximum: 5,
    example: 4,
    required: false,
  })
  @ValidateIf(
    (dto: UpdateEmployeeStatusDto) => dto.status === EmployeeStatus.TERMINATED,
  )
  @IsDefined({ message: 'exitRating is required when ending employment' })
  @IsInt()
  @Min(1)
  @Max(5)
  exitRating?: number;

  @ApiPropertyOptional({
    description:
      'Optional private comment with the exit rating (not the legal termination reason)',
    example: 'Strong contributor; team fit issues.',
  })
  @ValidateIf(
    (dto: UpdateEmployeeStatusDto) => dto.status === EmployeeStatus.TERMINATED,
  )
  @IsOptional()
  @IsString()
  exitComment?: string;
}
