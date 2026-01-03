import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { SystemConfigKey } from '../system-config-keys.enum';

export class UpdateSystemConfigDto {
  @IsString()
  @IsNotEmpty()
  key: SystemConfigKey | string;

  @IsNotEmpty()
  value: any;

  @IsOptional()
  @IsString()
  description?: string;
}
