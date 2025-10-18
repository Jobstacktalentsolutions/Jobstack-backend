import { DataSource } from 'typeorm';
import { EntitySeeder } from './seeders/entity.seeder';
import { SeedResult } from './interfaces/seeder.interface';

/**
 * Main seeding service for JobStack
 */
export class SeedingService {
  private readonly entitySeeder: EntitySeeder;

  constructor(private readonly dataSource: DataSource) {
    this.entitySeeder = new EntitySeeder(dataSource);
  }

  /**
   * Run entity seeding
   */
  async runEntities(entityNames: string[]): Promise<SeedResult> {
    return await this.entitySeeder.run(entityNames);
  }

  /**
   * Check if database is ready for seeding
   */
  async isDatabaseReady(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available entities
   */
  getAvailableEntities(): string[] {
    return this.entitySeeder.getAvailableEntities();
  }

  /**
   * Seed system essentials (permissions, roles, super admin)
   */
  async seedSystemEssentials(): Promise<SeedResult> {
    console.log('🔧 Seeding system essentials...');
    return await this.runEntities(['permissions', 'roles', 'admins']);
  }

  /**
   * Seed all available entities
   */
  async seedAll(): Promise<SeedResult> {
    console.log('🌍 Seeding all entities...');
    return await this.runEntities([]);
  }
}
