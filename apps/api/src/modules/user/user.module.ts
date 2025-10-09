import { Module } from '@nestjs/common';
// Aggregator module for user submodules

// Submodules
import { JobseekerModule } from './submodules/jobseeker/jobseeker.module';
import { RecruiterModule } from './submodules/recruiter/recruiter.module';
import { AdminModule } from './submodules/admin/admin.module';

@Module({
  imports: [JobseekerModule, RecruiterModule, AdminModule],
  controllers: [],
  providers: [],
  exports: [JobseekerModule, RecruiterModule, AdminModule],
})
export class UserModule {}
