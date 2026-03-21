import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UuidParamDto {
  @ApiProperty({ format: 'uuid', example: 'c3b2b0c8-1a23-4f6e-9a8b-1234567890ab' })
  @IsString()
  id: string;
}
