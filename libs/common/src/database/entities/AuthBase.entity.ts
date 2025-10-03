import { Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class AuthBase extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;
}
