import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractsService } from '../services/contracts.service';
import { JobApplication, Employee } from '@app/common/database/entities';
import { JobApplicationStatus } from '@app/common/database/entities/schema.enum';

@Injectable()
export class ContractEventListener {
  private readonly logger = new Logger(ContractEventListener.name);

  constructor(
    private readonly contractsService: ContractsService,
    @InjectRepository(JobApplication)
    private readonly jobApplicationRepo: Repository<JobApplication>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  /**
   * Listen for employee activation payment confirmation
   * Automatically generate contract when payment is confirmed
   */
  @OnEvent('employee-activation-payment.confirmed')
  async handleActivationPaymentConfirmed(payload: {
    paymentId: string;
    employeeId: string;
    employerId: string;
  }) {
    this.logger.log(
      `Handling activation payment confirmed event for employee ${payload.employeeId}`,
    );

    try {
      // Generate contract automatically
      const contract = await this.contractsService.generateEmploymentContract(
        payload.employeeId,
      );

      this.logger.log(
        `Contract generated automatically for employee ${payload.employeeId}: ${contract.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate contract for employee ${payload.employeeId}: ${error.message}`,
        error.stack,
      );
      // Don't throw - log error and continue
      // Contract can be generated manually if needed
    }
  }

  /**
   * Listen for contract fully executed event
   * Update job application status to CONTRACT_SIGNED
   */
  @OnEvent('contract.fully-executed')
  async handleContractFullyExecuted(payload: {
    contractId: string;
    employeeId: string;
  }) {
    this.logger.log(
      `Contract ${payload.contractId} fully executed for employee ${payload.employeeId}`,
    );

    try {
      const employee = await this.employeeRepo.findOne({
        where: { id: payload.employeeId },
      });

      if (!employee) {
        this.logger.warn(`Employee ${payload.employeeId} not found for contract fully-executed event`);
        return;
      }

      const jobApplication = await this.jobApplicationRepo.findOne({
        where: {
          jobId: employee.jobId,
          jobseekerProfileId: employee.jobseekerProfileId,
        },
      });

      if (jobApplication) {
        await this.jobApplicationRepo.update(jobApplication.id, {
          status: JobApplicationStatus.CONTRACT_SIGNED,
          statusUpdatedAt: new Date(),
        });
        this.logger.log(
          `Job application ${jobApplication.id} updated to CONTRACT_SIGNED`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update application status for contract ${payload.contractId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
