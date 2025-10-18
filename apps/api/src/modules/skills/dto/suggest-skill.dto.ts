import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SuggestSkillDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
