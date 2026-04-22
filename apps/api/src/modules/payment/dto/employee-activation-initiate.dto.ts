import { IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Optional JSON body for employee activation payment initiation
export class EmployeeActivationInitiateDto {
  @ApiPropertyOptional({
    example: 'https://app.jobstack.ng/employer/billing/callback',
  })
  @IsOptional()
  @IsUrl()
  callbackUrl?: string;
}
