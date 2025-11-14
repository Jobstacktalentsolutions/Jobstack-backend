import { Module } from '@nestjs/common';
// Aggregator module for user submodules

// Submodules
import { JobseekerModule } from './submodules/jobseeker/jobseeker.module';
import { EmployerModule } from './submodules/employer/employer.module';
import { AdminModule } from './submodules/admin/admin.module';

@Module({
  imports: [JobseekerModule, EmployerModule, AdminModule],
  controllers: [],
  providers: [],
  exports: [JobseekerModule, EmployerModule, AdminModule],
})
export class UserModule {}
