import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemConfigKey } from '../system-config-keys.enum';

export class UpdateSystemConfigDto {
  @ApiProperty({
    enum: SystemConfigKey,
    example: SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE,
  })
  @IsString()
  @IsNotEmpty()
  key: SystemConfigKey | string;

  @ApiProperty({
    description: 'Config value (type depends on key)',
    example: 12.5,
  })
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({
    example: 'Default activation commission percentage',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
