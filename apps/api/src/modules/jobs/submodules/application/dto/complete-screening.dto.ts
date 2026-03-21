import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO for marking screening as complete for a set of applications
export class CompleteScreeningDto {
  @ApiProperty({
    description: 'Applications that finished screening',
    type: [String],
    example: ['c3b2b0c8-1a23-4f6e-9a8b-1234567890ab'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  applicationIds: string[];
}
