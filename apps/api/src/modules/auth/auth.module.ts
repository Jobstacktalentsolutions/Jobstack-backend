import { Module } from '@nestjs/common';
import { EmployerAuthModule } from './submodules/employer/employer-auth.module';
import { JobSeekerAuthModule } from './submodules/jobseeker/jobseeker-auth.module';
import { AdminAuthModule } from './submodules/admin/admin-auth.module';

@Module({
  imports: [EmployerAuthModule, JobSeekerAuthModule, AdminAuthModule],
  exports: [EmployerAuthModule, JobSeekerAuthModule, AdminAuthModule],
})
export class AuthModule {}
