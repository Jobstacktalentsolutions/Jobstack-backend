import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

// Request to change email; verification will be sent to current phone number
export class RequestEmailChangeDto {
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;
}

// Confirm email change with SMS code sent to current phone
export class ConfirmEmailChangeDto {
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

// Request to change phone; verification will be sent to current email
export class RequestPhoneChangeDto {
  @IsPhoneNumber('ZZ')
  @IsNotEmpty()
  newPhoneNumber: string;
}

// Confirm phone change with email code sent to current email
export class ConfirmPhoneChangeDto {
  @IsPhoneNumber('ZZ')
  @IsNotEmpty()
  newPhoneNumber: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
