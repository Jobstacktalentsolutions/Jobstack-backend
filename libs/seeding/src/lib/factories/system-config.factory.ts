import { DataSource } from 'typeorm';
import { SystemConfig } from '@app/common/database/entities/SystemConfig.entity';
import { getRepositoryByName } from '../utils/repository.utils';
import { SYSTEM_CONFIG_DATA } from '../data/system-config.data';

/**
 * Factory for seeding system configuration values.
 * Uses upsert semantics: inserts missing keys, updates existing ones.
 */
export class SystemConfigFactory {
  private readonly repository: ReturnType<
    typeof getRepositoryByName<SystemConfig>
  >;

  constructor(private readonly dataSource: DataSource) {
    this.repository = getRepositoryByName<SystemConfig>(
      dataSource,
      'SystemConfig',
    );
  }

  async createAll(): Promise<SystemConfig[]> {
    console.log('🔄 Upserting system config records...');

    const results: SystemConfig[] = [];

    for (const entry of SYSTEM_CONFIG_DATA) {
      try {
        const existing = await this.repository.findOne({
          where: { key: entry.key },
        });

        if (existing) {
          await this.repository.update(
            { key: entry.key },
            {
              value: JSON.stringify(entry.value),
              description: entry.description,
            },
          );
          const updated = await this.repository.findOne({
            where: { key: entry.key },
          });
          results.push(updated!);
          console.log(`  ↩  Updated: ${entry.key} = ${entry.value}`);
        } else {
          const record = this.repository.create({
            key: entry.key,
            value: JSON.stringify(entry.value),
            description: entry.description,
          });
          const saved = await this.repository.save(record);
          results.push(saved);
          console.log(`  ✚  Inserted: ${entry.key} = ${entry.value}`);
        }
      } catch (error) {
        console.warn(
          `  ⚠  Failed to upsert config key "${entry.key}": ${error.message}`,
        );
      }
    }

    console.log(`✅ Upserted ${results.length} system config records`);
    return results;
  }
}
