import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ContractTemplateType } from './schema.enum';

@Entity('contract_templates')
export class ContractTemplate extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ContractTemplateType,
  })
  type: ContractTemplateType;

  /**
   * Path to the Handlebars template file relative to templates directory
   * Example: 'contracts/permanent-employment.hbs'
   */
  @Column()
  templatePath: string;

  /**
   * List of variable names that this template expects
   * Used for validation and documentation
   */
  @Column('simple-array')
  requiredVariables: string[];

  /**
   * Whether this template is currently active and available for selection
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Display order in UI (lower numbers appear first)
   */
  @Column({ default: 0 })
  displayOrder: number;

  /**
   * Version string for tracking template updates
   */
  @Column({ default: '1.0' })
  version: string;

  /**
   * Example data for preview/testing purposes (stored as JSON)
   */
  @Column({ type: 'jsonb', nullable: true })
  exampleData?: Record<string, any>;
}
