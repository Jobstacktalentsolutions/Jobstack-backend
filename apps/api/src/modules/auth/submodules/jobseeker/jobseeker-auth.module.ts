import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { JobseekerSession } from '@app/common/database/entities/JobseekerSession.entity';
import { RedisModule } from '@app/common/redis/redis.module';
import { createJwtConfig } from '@app/common/config/jwt.config';
import { JobSeekerAuthService } from './jobseeker-auth.service';
import { JobSeekerAuthController } from './jobseeker-auth.controller';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';
import { NotificationModule } from '../../../notification/notification.module';
import { SkillsModule } from '../../../skills/skills.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobseekerAuth,
      JobSeekerProfile,
      JobseekerSession,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: createJwtConfig,
      inject: [ConfigService],
    }),
    RedisModule,
    NotificationModule,
    SkillsModule,
  ],
  controllers: [JobSeekerAuthController],
  providers: [JobSeekerAuthService, JobSeekerJwtGuard],
  exports: [JobSeekerAuthService, JobSeekerJwtGuard],
})
export class JobSeekerAuthModule {}
