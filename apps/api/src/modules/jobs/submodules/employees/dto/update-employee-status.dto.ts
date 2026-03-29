import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmployeeStatus } from '@app/common/database/entities/schema.enum';

export enum EmployeeTerminationHrMeaning {
  EMPLOYEE_RESIGNED = 'EMPLOYEE_RESIGNED',
  EMPLOYEE_TERMINATED = 'EMPLOYEE_TERMINATED',
  ROLE_REDUNDANT = 'ROLE_REDUNDANT',
  MUTUAL_SEPARATION = 'MUTUAL_SEPARATION',
  OTHER = 'OTHER',
}

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
  @ValidateIf((dto: UpdateEmployeeStatusDto) => dto.status === EmployeeStatus.TERMINATED)
  @IsString()
  @IsNotEmpty()
  reasonForTermination?: string;
}
