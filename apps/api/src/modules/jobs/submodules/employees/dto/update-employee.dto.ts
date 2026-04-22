import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';

// Employer update payload; job and candidate IDs are immutable after creation.
export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['jobId', 'jobseekerProfileId'] as const),
) {}
