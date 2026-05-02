import { Module, forwardRef } from '@nestjs/common';
import { GoogleIdentityService } from './google-identity.service';
import { UnifiedGoogleAuthController } from './unified-google-auth.controller';
import { EmployerAuthModule } from '../submodules/employer/employer-auth.module';
import { JobSeekerAuthModule } from '../submodules/jobseeker/jobseeker-auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => EmployerAuthModule),
    forwardRef(() => JobSeekerAuthModule),
  ],
  controllers: [UnifiedGoogleAuthController],
  providers: [GoogleIdentityService],
  exports: [GoogleIdentityService],
})
export class GoogleIdentityModule {}
