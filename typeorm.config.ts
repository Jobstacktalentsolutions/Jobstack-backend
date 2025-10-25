import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';

ConfigModule.forRoot({ isGlobal: true });

const configService = new ConfigService();
const nodeEnv = configService.get<string>('NODE_ENV', 'development');

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  url: configService.getOrThrow<string>('DATABASE_URL'),
  entities: [
    'libs/common/src/database/entities/*.entity.ts',
    'dist/libs/common/src/database/entities/*.entity.js',
  ],
  migrations: ['migrations/**/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: true,
  logging: false, // disable verbose TypeORM logs
};

const dataSource = new DataSource(typeOrmConfig);

export default dataSource;
