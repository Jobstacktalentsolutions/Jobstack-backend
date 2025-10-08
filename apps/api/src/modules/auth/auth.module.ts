import { Module } from '@nestjs/common';
import { RecruiterAuthModule } from './submodules/recruiter/recruiter-auth.module';
import { JobSeekerAuthModule } from './submodules/jobseeker/jobseeker-auth.module';
import { AdminAuthModule } from './submodules/admin/admin-auth.module';

@Module({
  imports: [RecruiterAuthModule, JobSeekerAuthModule, AdminAuthModule],
  exports: [RecruiterAuthModule, JobSeekerAuthModule, AdminAuthModule],
})
export class AuthModule {}
