import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { JobseekerSession } from '@app/common/database/entities/JobseekerSession.entity';
import { EmployerAuth } from '@app/common/database/entities/EmployerAuth.entity';
import { RedisModule } from '@app/common/redis/redis.module';
import { JobSeekerAuthService } from './jobseeker-auth.service';
import { JobSeekerAuthController } from './jobseeker-auth.controller';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';
import { NotificationModule } from '../../../notification/notification.module';
import { SkillsModule } from '../../../skills/skills.module';
import { GoogleIdentityModule } from '../../google/google-identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobseekerAuth,
      EmployerAuth,
      JobSeekerProfile,
      JobseekerSession,
    ]),
    RedisModule,
    NotificationModule,
    forwardRef(() => SkillsModule),
    GoogleIdentityModule,
  ],
  controllers: [JobSeekerAuthController],
  providers: [JobSeekerAuthService, JobSeekerJwtGuard],
  exports: [JobSeekerAuthService, JobSeekerJwtGuard],
})
export class JobSeekerAuthModule {}
