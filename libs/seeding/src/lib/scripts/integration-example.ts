import { DataSource } from 'typeorm';
import { SeedingService } from '../seeding.service';

/**
 * Example of how to integrate seeding into your NestJS application
 * This would typically go in your main.ts or a database initialization service
 */
export async function initializeDatabase(
  dataSource: DataSource,
): Promise<void> {
  console.log('🔧 Initializing database with essential data...');

  const seedingService = new SeedingService(dataSource);

  // Check if database is ready
  if (!(await seedingService.isDatabaseReady())) {
    throw new Error('Database is not ready for seeding');
  }

  try {
    // Seed system essentials (safe to run on every startup)
    const result = await seedingService.seedSystemEssentials();

    if (result.success) {
      console.log('✅ Database initialization completed successfully');
      console.log(`📊 ${result.message}`);
    } else {
      console.warn('⚠️ Database initialization completed with warnings');
      console.warn(`📊 ${result.message}`);
      if (result.errors) {
        result.errors.forEach((error) => console.warn(`  - ${error}`));
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Example NestJS main.ts integration
 */
export async function exampleNestJSIntegration() {
  // This would be in your main.ts file
  /*
  import { NestFactory } from '@nestjs/core';
  import { AppModule } from './app.module';
  import { DataSource } from 'typeorm';
  import { initializeDatabase } from '@app/seeding/scripts/integration-example';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Get the DataSource from your app
    const dataSource = app.get(DataSource);
    
    // Initialize database with seeding
    await initializeDatabase(dataSource);
    
    await app.listen(3000);
  }
  bootstrap();
  */
}
