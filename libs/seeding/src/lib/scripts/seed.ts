#!/usr/bin/env node

// Ensure reflect-metadata is imported before any entity is loaded so
// TypeORM can read emitted decorator metadata (required for column types)
import 'reflect-metadata';

import { DataSource } from 'typeorm';
import { typeOrmConfig } from '@app/common';
import { SeedingService } from '../seeding.service';

/**
 * Seeding script for JobStack
 * Usage: node seed.js [entity1] [entity2] ...
 * Available entities: admins, skills
 */
async function runSeeding() {
  // Get entity names from command line arguments
  const entityNames = process.argv.slice(2);

  console.log('🌱 JobStack Seeding Script');
  console.log('==========================');

  if (entityNames.length > 0) {
    console.log(`📋 Entities to seed: ${entityNames.join(', ')}`);
  } else {
    console.log('📋 Seeding all available entities');
  }

  let dataSource: DataSource;

  try {
    // Initialize database connection
    console.log('\n🔌 Connecting to database...');
    dataSource = new DataSource(typeOrmConfig as any);
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    // Initialize seeding service
    const seedingService = new SeedingService(dataSource);

    // Show available entities
    const availableEntities = seedingService.getAvailableEntities();
    console.log(`\n📦 Available entities: ${availableEntities.join(', ')}`);

    // Run seeding
    console.log('\n🚀 Starting seeding process...');
    const result = await seedingService.runEntities(entityNames);

    // Display results
    console.log('\n📊 Seeding Results:');
    console.log('==================');
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Message: ${result.message}`);

    if (result.count !== undefined) {
      console.log(`Records seeded: ${result.count}`);
    }

    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Fatal error during seeding:');
    console.error(error);
    process.exit(1);
  } finally {
    // Clean up database connection
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the seeding script
runSeeding();
