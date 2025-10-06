import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { CommonModule, ConfigModule, LoggerModule } from '@app/common';
import { AuthModule } from './modules/auth/auth.module';
import { JobseekerProfileModule } from './modules/jobseeker-profile/jobseeker-profile.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SkillsModule } from './modules/skills/skills.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    CommonModule,
    NotificationModule,
    SkillsModule,
    AuthModule,
    JobseekerProfileModule,
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
