import { PartialType } from '@nestjs/swagger';
import { CreateJobDto } from './create-job.dto';

// Partial update payload for job fields (same shape as create, all optional).
export class UpdateJobDto extends PartialType(CreateJobDto) {}
