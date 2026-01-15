import { IsString, IsUUID } from 'class-validator';

export class UuidParamDto {
  @IsString()
  id: string;
}
