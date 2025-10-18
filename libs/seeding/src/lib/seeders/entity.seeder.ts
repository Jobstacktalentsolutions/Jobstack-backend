import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { SeedResult } from '../interfaces/seeder.interface';
import { PermissionFactory } from '../factories/permission.factory';
import { RoleFactory } from '../factories/role.factory';
import { AdminFactory } from '../factories/admin.factory';
import { SkillFactory } from '../factories/skill.factory';

/**
 * Entity seeder that handles seeding of different entities
 */
export class EntitySeeder extends BaseSeeder {
  private readonly entityFactories: Map<string, any>;

  constructor(dataSource: DataSource) {
    super(dataSource);

    // Initialize factories
    this.entityFactories = new Map([
      ['permissions', new PermissionFactory(dataSource)],
      ['roles', new RoleFactory(dataSource)],
      ['admins', new AdminFactory(dataSource)],
      ['skills', new SkillFactory(dataSource)],
    ]);
  }

  /**
   * Run seeding for specified entities
   */
  async run(entityNames: string[]): Promise<SeedResult> {
    const errors: string[] = [];
    let totalCount = 0;

    console.log('🌱 Starting seeding process...');

    // Check if database is ready
    if (!(await this.isDatabaseReady())) {
      return this.createFailureResult('Database is not ready for seeding');
    }

    // If no entities specified, seed all
    if (entityNames.length === 0) {
      entityNames = this.getAvailableEntities();
    }

    // Validate entity names
    const invalidEntities = entityNames.filter(
      (name) => !this.entityFactories.has(name),
    );
    if (invalidEntities.length > 0) {
      return this.createFailureResult(
        `Invalid entity names: ${invalidEntities.join(', ')}`,
        invalidEntities,
      );
    }

    // Define seeding order to handle dependencies
    const seedingOrder = ['permissions', 'roles', 'admins', 'skills'];
    const orderedEntities = seedingOrder.filter((entity) =>
      entityNames.includes(entity),
    );

    // Add any remaining entities not in the predefined order
    const remainingEntities = entityNames.filter(
      (entity) => !seedingOrder.includes(entity),
    );
    orderedEntities.push(...remainingEntities);

    // Seed entities in order
    for (const entityName of orderedEntities) {
      try {
        console.log(`\n📦 Seeding ${entityName}...`);
        const factory = this.entityFactories.get(entityName);
        const entities = await factory.createAll();
        totalCount += entities.length;
        console.log(`✅ Successfully seeded ${entities.length} ${entityName}`);
      } catch (error) {
        const errorMessage = `Failed to seed ${entityName}: ${error.message}`;
        console.error(`❌ ${errorMessage}`);
        errors.push(errorMessage);
      }
    }

    console.log('\n🎉 Seeding process completed!');

    if (errors.length > 0) {
      return this.createFailureResult(
        `Seeding completed with ${errors.length} errors`,
        errors,
      );
    }

    return this.createSuccessResult(
      `Successfully seeded ${totalCount} records across ${orderedEntities.length} entities`,
      totalCount,
    );
  }

  /**
   * Get available entities for seeding
   */
  getAvailableEntities(): string[] {
    return Array.from(this.entityFactories.keys());
  }
}
