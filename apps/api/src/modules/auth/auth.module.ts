import { Module } from '@nestjs/common';
import { RecruiterAuthModule } from './recruiter-auth/recruiter-auth.module';
import { JobSeekerAuthModule } from './jobseeker-auth/jobseeker-auth.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';

@Module({
  imports: [RecruiterAuthModule, JobSeekerAuthModule, AdminAuthModule],
  exports: [RecruiterAuthModule, JobSeekerAuthModule, AdminAuthModule],
})
export class AuthModule {}
