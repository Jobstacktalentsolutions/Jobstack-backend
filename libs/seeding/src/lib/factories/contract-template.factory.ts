import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { ContractTemplate } from '@app/common/database/entities/ContractTemplate.entity';
import { getRepositoryByName } from '../utils/repository.utils';
import { CONTRACT_TEMPLATES } from '../data/contract-templates.data';

export class ContractTemplateFactory extends BaseFactory<ContractTemplate> {
  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'ContractTemplate'), {
      defaultAttributes: () => ({}),
    });
  }

  async createAll(): Promise<ContractTemplate[]> {
    console.log('Upserting contract template records...');

    const templates: ContractTemplate[] = [];
    for (const templateData of CONTRACT_TEMPLATES) {
      try {
        const template = await this.smartUpsert(templateData, ['name', 'type']);
        templates.push(template);
      } catch (error) {
        console.warn(
          `Failed to upsert contract template: ${templateData.name}`,
          error.message,
        );
      }
    }

    console.log(`Upserted ${templates.length} contract template records`);
    return templates;
  }
}
