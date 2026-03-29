import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Contract,
  ContractTemplate,
  Document,
  Employee,
  JobApplication,
} from '@app/common/database/entities';
import { ContractsService } from './services/contracts.service';
import { ContractsController } from './controllers/contracts.controller';
import { ContractEventListener } from './listeners/contract-event.listener';
import { EmployerAuthModule } from '../auth/submodules/employer/employer-auth.module';
import { JobSeekerAuthModule } from '../auth/submodules/jobseeker/jobseeker-auth.module';
import { AdminAuthModule } from '../auth/submodules/admin/admin-auth.module';
import { StorageModule } from '@app/common/storage';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      ContractTemplate,
      Document,
      Employee,
      JobApplication,
    ]),
    StorageModule,
    EmployerAuthModule,
    JobSeekerAuthModule,
    AdminAuthModule,
  ],
  providers: [ContractsService, ContractEventListener],
  controllers: [ContractsController],
  exports: [ContractsService],
})
export class ContractsModule {}
