import { IsEnum } from 'class-validator';
import { EmployeeStatus } from '@app/common/database/entities/schema.enum';

export class UpdateEmployeeStatusDto {
  @IsEnum(EmployeeStatus)
  status: EmployeeStatus;
}
