import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';

// Load environment variables from .env file
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

console.log('database url', databaseUrl);

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  url: databaseUrl,
  entities: [
    'libs/common/src/database/entities/*.entity.ts',
    'dist/libs/common/src/database/entities/*.entity.js',
  ],
  migrations: ['migrations/**/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: true, // Should be false in production
  logging: false, // disable verbose TypeORM logs
};

const dataSource = new DataSource(typeOrmConfig);

export default dataSource;
