import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ENV } from '../config/env.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>(ENV.NODE_ENV, 'development');

        console.log(
          'database url',
          configService.getOrThrow<string>(ENV.DATABASE_URL),
        );
        return {
          type: 'postgres',
          url: configService.getOrThrow<string>(ENV.DATABASE_URL),
          entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
          autoLoadEntities: true,
          synchronize: nodeEnv !== 'production',
          logging: nodeEnv === 'development',
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
