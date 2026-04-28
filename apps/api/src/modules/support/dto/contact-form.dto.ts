import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ContactFormDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  emailAddress: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}
