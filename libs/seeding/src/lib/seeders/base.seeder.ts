import { DataSource } from 'typeorm';
import { SeedResult, ISeeder } from '../interfaces/seeder.interface';

/**
 * Base seeder class
 */
export abstract class BaseSeeder implements ISeeder {
  constructor(protected readonly dataSource: DataSource) {}

  abstract run(entityNames: string[]): Promise<SeedResult>;
  abstract getAvailableEntities(): string[];

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
   * Create a successful seed result
   */
  protected createSuccessResult(message: string, count?: number): SeedResult {
    return {
      success: true,
      message,
      count,
    };
  }

  /**
   * Create a failed seed result
   */
  protected createFailureResult(
    message: string,
    errors?: string[],
  ): SeedResult {
    return {
      success: false,
      message,
      errors,
    };
  }
}
