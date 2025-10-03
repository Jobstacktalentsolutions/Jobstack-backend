import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ENV } from '../config/env.config';

ConfigModule.forRoot({ isGlobal: true });

const configService = new ConfigService();
const nodeEnv = configService.get<string>(ENV.NODE_ENV, 'development');

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  url: configService.getOrThrow<string>(ENV.DATABASE_URL),
  entities: ['dist/**/*.entity.js'],
  migrations: ['migrations/**/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: nodeEnv === 'development',
};

const dataSource = new DataSource(typeOrmConfig);

export default dataSource;
