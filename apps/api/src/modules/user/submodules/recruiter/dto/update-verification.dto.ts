import { IsOptional, IsString } from 'class-validator';

export class UpdateVerificationInfoDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsString()
  socialOrWebsiteUrl?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;
}
