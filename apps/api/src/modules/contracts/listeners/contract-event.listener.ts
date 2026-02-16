import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ContractsService } from '../services/contracts.service';

@Injectable()
export class ContractEventListener {
  private readonly logger = new Logger(ContractEventListener.name);

  constructor(private readonly contractsService: ContractsService) {}

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
   * Update job application status to HIRED
   */
  @OnEvent('contract.fully-executed')
  async handleContractFullyExecuted(payload: {
    contractId: string;
    employeeId: string;
  }) {
    this.logger.log(
      `Contract ${payload.contractId} fully executed for employee ${payload.employeeId}`,
    );

    // Additional actions can be added here (e.g., notify parties, update analytics)
  }
}
