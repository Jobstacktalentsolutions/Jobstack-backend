import { CreateSkillDto } from './create-skill.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}
