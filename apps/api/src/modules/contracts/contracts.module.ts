import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Contract,
  ContractTemplate,
  Employee,
  JobApplication,
} from '@app/common/database/entities';
import { ContractsService } from './services/contracts.service';
import { ContractsController } from './controllers/contracts.controller';
import { ContractEventListener } from './listeners/contract-event.listener';
import { EmployerAuthModule } from '../auth/submodules/employer/employer-auth.module';
import { JobSeekerAuthModule } from '../auth/submodules/jobseeker/jobseeker-auth.module';
import { AdminAuthModule } from '../auth/submodules/admin/admin-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, ContractTemplate, Employee, JobApplication]),
    EmployerAuthModule,
    JobSeekerAuthModule,
    AdminAuthModule,
  ],
  providers: [ContractsService, ContractEventListener],
  controllers: [ContractsController],
  exports: [ContractsService],
})
export class ContractsModule {}
