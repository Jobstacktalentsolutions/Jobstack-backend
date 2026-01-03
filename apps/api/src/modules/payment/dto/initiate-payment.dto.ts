import { IsUUID, IsOptional, IsUrl } from 'class-validator';

export class InitiatePaymentDto {
  @IsUUID()
  employeeId: string;

  @IsOptional()
  @IsUrl()
  callbackUrl?: string;
}
