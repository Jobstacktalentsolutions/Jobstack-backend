import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmployeeStatus } from '@app/common/database/entities/schema.enum';

export class UpdateEmployeeStatusDto {
  @ApiProperty({ enum: EmployeeStatus, example: EmployeeStatus.ACTIVE })
  @IsEnum(EmployeeStatus)
  status: EmployeeStatus;
}
