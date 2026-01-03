import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AdminAuth } from './AdminAuth.entity';

@Entity('system_configs')
export class SystemConfig extends BaseEntity {
  @Column({ unique: true })
  key: string;

  @Column({ type: 'text' })
  value: string; // JSON-serialized value

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => AdminAuth, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedByAdmin?: AdminAuth;

  @Column('uuid', { nullable: true })
  updatedBy?: string;
}
