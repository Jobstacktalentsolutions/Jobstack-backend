import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { CommonModule, LoggerModule } from '@app/common';
import { ConfigModule } from './modules/config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { JobseekerModule } from './modules/user/submodules/jobseeker/jobseeker.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SkillsModule } from './modules/skills/skills.module';
import { appProviders } from '@app/common/shared/utils/app.providers';
import { UserModule } from './modules/user/user.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    CommonModule,
    NotificationModule,
    SkillsModule,
    AuthModule,
    JobseekerModule,
    UserModule,
    JobsModule,
    PaymentModule,
  ],
  controllers: [ApiController],
  providers: [ApiService, ...appProviders('api')],
})
export class ApiModule {}
