import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ApplicantAcceptOfferDto {
  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
