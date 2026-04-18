import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReferenceContactDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '+2348099988776' })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty({ example: '12 Adeola Odeku, Victoria Island, Lagos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  homeAddress: string;

  @ApiProperty({ example: 'Former Team Lead' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  relationship: string;
}
