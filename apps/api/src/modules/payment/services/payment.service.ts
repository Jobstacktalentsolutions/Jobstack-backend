import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Payment,
  Employee,
  EmployerProfile,
  JobApplication,
} from '@app/common/database/entities';
import {
  PaymentStatus,
  PaymentType,
  EmploymentArrangement,
  EmployeePaymentStatus,
  EmployeeStatus,
  JobApplicationStatus,
} from '@app/common/database/entities/schema.enum';
import { PaystackService } from './paystack.service';
import { SystemConfigService } from '../../system-config/services/system-config.service';
import { EmployeeActivationCommissionService } from './commission.service';
import {
  PaymentCalculationResult,
  InitiatePaymentParams,
  PaymentVerificationResult,
  PaymentHistoryQuery,
  PaymentHistoryResult,
  PaymentRequiredException,
} from '../interfaces/payment.interface';
import { CommissionBreakdown } from '../interfaces/commission.interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(EmployerProfile)
    private readonly employerRepo: Repository<EmployerProfile>,
    @InjectRepository(JobApplication)
    private readonly jobApplicationRepo: Repository<JobApplication>,
    private readonly paystackService: PaystackService,
    private readonly systemConfigService: SystemConfigService,
    private readonly commissionService: EmployeeActivationCommissionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Calculate payment amount based on employment arrangement
  async calculatePaymentAmount(
    employee: Employee,
  ): Promise<PaymentCalculationResult> {
    const percentage =
      await this.systemConfigService.getEmployeeActivationPercentage();

    let baseAmount: number;

    if (employee.employmentArrangement === EmploymentArrangement.CONTRACT) {
      if (!employee.contractFeeOffered) {
        throw new BadRequestException(
          'Contract fee is required for contract employees',
        );
      }
      baseAmount = employee.contractFeeOffered;
    } else if (
      employee.employmentArrangement ===
      EmploymentArrangement.PERMANENT_EMPLOYEE
    ) {
      if (!employee.salaryOffered) {
        throw new BadRequestException(
          'Salary is required for permanent employees',
        );
      }
      baseAmount = employee.salaryOffered;
    } else {
      throw new BadRequestException('Invalid employment arrangement');
    }

    const amount = (baseAmount * percentage) / 100;
    const currency = employee.currency || 'NGN';

    return {
      amount,
      percentage,
      baseAmount,
      currency,
      paymentType: PaymentType.EMPLOYEE_ACTIVATION_FEE,
    };
  }

  // Initiate payment for employee activation
  async initiatePayment(
    params: InitiatePaymentParams,
  ): Promise<{ paymentId: string; paymentUrl: string; reference: string }> {
    // Get employee with employer details
    const employee = await this.employeeRepo.findOne({
      where: { id: params.employeeId, employerId: params.employerId },
      relations: ['employer'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepo.findOne({
      where: {
        employeeId: params.employeeId,
        status: PaymentStatus.PENDING,
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        'Payment already initiated for this employee',
      );
    }

    // Calculate payment amount
    const calculation = await this.calculatePaymentAmount(employee);

    // Generate payment reference
    const reference = this.paystackService.generateReference('EMP');

    // Create payment record
    const payment = this.paymentRepo.create({
      employeeId: params.employeeId,
      employerId: params.employerId,
      amount: calculation.amount,
      percentage: calculation.percentage,
      currency: calculation.currency,
      status: PaymentStatus.PENDING,
      paymentType: calculation.paymentType,
      paystackReference: reference,
      metadata: {
        baseAmount: calculation.baseAmount,
        employmentArrangement: employee.employmentArrangement,
      },
    });

    const savedPayment = await this.paymentRepo.save(payment);

    // Update employee payment status
    await this.employeeRepo.update(params.employeeId, {
      paymentStatus: EmployeePaymentStatus.PENDING,
      activationPaymentId: savedPayment.id,
    });

    // Initialize Paystack transaction
    const paystackResponse = await this.paystackService.initializeTransaction({
      email: employee.employer.email,
      amount: this.paystackService.convertToKobo(calculation.amount),
      reference,
      currency: calculation.currency,
      callback_url: params.callbackUrl,
      metadata: {
        paymentId: savedPayment.id,
        employeeId: params.employeeId,
        employerId: params.employerId,
        paymentType: calculation.paymentType,
      },
    });

    this.logger.log(
      `Payment initiated for employee ${params.employeeId}: ${savedPayment.id}`,
    );

    return {
      paymentId: savedPayment.id,
      paymentUrl: paystackResponse.data.authorization_url,
      reference,
    };
  }

  // Verify payment completion
  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    // Get payment record
    const payment = await this.paymentRepo.findOne({
      where: { paystackReference: reference },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify with Paystack
    const paystackResponse =
      await this.paystackService.verifyTransaction(reference);

    let status: PaymentStatus;
    let paidAt: Date | undefined;

    if (paystackResponse.data.status === 'success') {
      status = PaymentStatus.SUCCESS;
      paidAt = new Date(paystackResponse.data.paid_at);
    } else {
      status = PaymentStatus.FAILED;
    }

    // Store the Paystack transaction ID regardless of outcome
    await this.paymentRepo.update(payment.id, {
      paystackTransactionId: paystackResponse.data.id?.toString(),
    });

    if (status === PaymentStatus.SUCCESS) {
      // Delegate to the same method used by the webhook so both paths are identical.
      // processActivationPaymentSuccess is idempotent — safe to call even if the
      // webhook already ran first.
      if (payment.paymentType === PaymentType.EMPLOYEE_ACTIVATION_FEE) {
        await this.processActivationPaymentSuccess(payment.id);
      } else {
        await this.employeeRepo.update(payment.employeeId, {
          paymentStatus: EmployeePaymentStatus.PAID,
          activationBlocked: false,
          piiUnlocked: true,
        });
      }
    } else {
      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.FAILED,
      });
      await this.employeeRepo.update(payment.employeeId, {
        paymentStatus: EmployeePaymentStatus.FAILED,
        activationBlocked: true,
      });
    }

    this.logger.log(`Payment verified: ${reference} - Status: ${status}`);

    return {
      success: status === PaymentStatus.SUCCESS,
      paymentId: payment.id,
      paystackReference: reference,
      amount: payment.amount,
      status,
      paidAt,
    };
  }

  // Check if payment is required and completed for employee activation or application PII unlock
  async checkPaymentStatus(
    id: string,
  ): Promise<{ required: boolean; completed: boolean; paymentId?: string }> {
    // First try as employee
    const employee = await this.employeeRepo.findOne({
      where: { id },
    });

    if (employee) {
      const hasPaymentAmount = employee.salaryOffered || employee.contractFeeOffered;
      if (!hasPaymentAmount) return { required: false, completed: true };
      
      return {
        required: true,
        completed: employee.paymentStatus === EmployeePaymentStatus.PAID || employee.piiUnlocked,
        paymentId: employee.activationPaymentId,
      };
    }

    // Then try as application
    const application = await this.jobApplicationRepo.findOne({
      where: { id },
      relations: ['job'],
    });

    if (application) {
      const hasPaymentAmount = application.job.salary || application.job.contractFee;
      if (!hasPaymentAmount) return { required: false, completed: true };

      // Look up payment by applicationId to get the paymentId if completed
      const payment = await this.paymentRepo.findOne({
        where: { applicationId: id, paymentType: PaymentType.EMPLOYEE_ACTIVATION_FEE, status: PaymentStatus.SUCCESS }
      });

      return {
        required: true,
        completed: application.piiUnlocked,
        paymentId: payment?.id,
      };
    }

    throw new NotFoundException('Employee or Application not found');
  }

  // Get payment history for employer/employee
  async getPaymentHistory(
    query: PaymentHistoryQuery,
  ): Promise<PaymentHistoryResult> {
    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.employee', 'employee')
      .leftJoinAndSelect('payment.employer', 'employer');

    this.applyPaymentFilters(qb, query);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    qb.take(limit)
      .skip((page - 1) * limit)
      .orderBy('payment.createdAt', 'DESC');

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, limit };
  }

  // Get payment by ID
  async getPaymentById(
    paymentId: string,
    employerId?: string,
  ): Promise<Payment> {
    const whereClause: any = { id: paymentId };
    if (employerId) {
      whereClause.employerId = employerId;
    }

    const payment = await this.paymentRepo.findOne({
      where: whereClause,
      relations: ['employee', 'employer'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // Process webhook event
  async processWebhookEvent(event: any): Promise<void> {
    if (event.event === 'charge.success') {
      const reference = event.data.reference;

      try {
        // Find payment by reference to determine type
        const payment = await this.paymentRepo.findOne({
          where: { paystackReference: reference },
        });

        if (!payment) {
          this.logger.warn(`Payment not found for reference: ${reference}`);
          return;
        }

        // Handle based on payment type
        if (payment.paymentType === PaymentType.EMPLOYEE_ACTIVATION_FEE) {
          // Process activation payment
          await this.processActivationPaymentSuccess(payment.id);
          this.logger.log(
            `Activation payment processed successfully: ${payment.id}`,
          );
        } else {
          // Legacy payment verification
          await this.verifyPayment(reference);
          this.logger.log(
            `Webhook processed successfully for reference: ${reference}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to process webhook for reference ${reference}: ${error.message}`,
        );
      }
    }
  }

  // Validate employee can be activated (payment check)
  async validateEmployeeActivation(employeeId: string): Promise<void> {
    const paymentStatus = await this.checkPaymentStatus(employeeId);

    if (paymentStatus.required && !paymentStatus.completed) {
      throw new PaymentRequiredException(
        'Payment is required before employee can be activated',
        paymentStatus.paymentId,
      );
    }
  }

  // Apply filters to payment query
  private applyPaymentFilters(
    qb: SelectQueryBuilder<Payment>,
    query: PaymentHistoryQuery,
  ): void {
    if (query.employerId) {
      qb.andWhere('payment.employerId = :employerId', {
        employerId: query.employerId,
      });
    }

    if (query.employeeId) {
      qb.andWhere('payment.employeeId = :employeeId', {
        employeeId: query.employeeId,
      });
    }

    if (query.status) {
      qb.andWhere('payment.status = :status', { status: query.status });
    }

    if (query.paymentType) {
      qb.andWhere('payment.paymentType = :paymentType', {
        paymentType: query.paymentType,
      });
    }
  }

  // ==================== NEW ACTIVATION PAYMENT METHODS ====================

  /**
   * Get commission breakdown for an employee activation payment (preview before paying)
   */
  async getActivationBreakdown(
    applicationId: string,
    employerId: string,
  ): Promise<CommissionBreakdown> {
    const application = await this.jobApplicationRepo.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });

    if (!application || application.job?.employerId !== employerId) {
      throw new NotFoundException('Application not found or unauthorized');
    }

    const isContract =
      application.job.employmentArrangement === EmploymentArrangement.CONTRACT;
    const baseAmount = isContract
      ? application.job.contractFee
      : application.job.salary;

    if (!baseAmount) {
      throw new BadRequestException(
        'Job must have salary or contract fee defined',
      );
    }

    return this.commissionService.calculateCommissionFee(
      baseAmount,
      isContract,
    );
  }

  /**
   * Initiate employee activation payment with commission calculation
   */
  async initiateActivationPayment(
    applicationId: string,
    employerId: string,
    callbackUrl?: string,
  ): Promise<{
    paymentId: string;
    paymentUrl: string;
    reference: string;
    accessCode: string;
    publicKey: string;
  }> {
    // Load application with relations
    const application = await this.jobApplicationRepo.findOne({
      where: { id: applicationId },
      relations: ['job', 'job.employer', 'jobseekerProfile'],
    });

    if (!application || application.job?.employerId !== employerId) {
      throw new NotFoundException('Application not found or unauthorized');
    }

    if (!application.jobseekerProfile) {
      throw new BadRequestException('Application is missing jobseeker profile');
    }

    // Validate PII not already unlocked
    if (application.piiUnlocked) {
      throw new BadRequestException('Candidate contact info is already unlocked');
    }

    // Check for existing pending payment — reuse it instead of creating a duplicate.
    const existingPayment = await this.paymentRepo.findOne({
      where: {
        applicationId,
        paymentType: PaymentType.EMPLOYEE_ACTIVATION_FEE,
        status: PaymentStatus.PENDING,
      },
    });

    if (existingPayment) {
      this.logger.log(
        `Reusing existing pending payment ${existingPayment.id} for application ${applicationId}`,
      );

      // Reuse the stored access_code so Paystack can restore pre-filled session.
      if (
        existingPayment.paystackAccessCode &&
        existingPayment.paystackReference
      ) {
        return {
          paymentId: existingPayment.id,
          paymentUrl: `https://checkout.paystack.com/${existingPayment.paystackAccessCode}`,
          reference: existingPayment.paystackReference,
          accessCode: existingPayment.paystackAccessCode,
          publicKey: this.paystackService.getPublicKey(),
        };
      }

      // No stored access_code (legacy record) — initialize a fresh Paystack transaction
      const freshReference = this.paystackService.generateReference('ACT');
      const paystackResponse = await this.paystackService.initializeTransaction(
        {
          email: application.job.employer.email,
          amount: this.paystackService.convertToKobo(existingPayment.amount),
          reference: freshReference,
          currency: existingPayment.currency || 'NGN',
          callback_url: callbackUrl,
          metadata: {
            paymentId: existingPayment.id,
            applicationId,
            employerId,
            paymentType: PaymentType.EMPLOYEE_ACTIVATION_FEE,
          },
        },
      );

      await this.paymentRepo.update(existingPayment.id, {
        paystackReference: freshReference,
        paystackAccessCode: paystackResponse.data.access_code,
      });

      return {
        paymentId: existingPayment.id,
        paymentUrl: paystackResponse.data.authorization_url,
        reference: freshReference,
        accessCode: paystackResponse.data.access_code,
        publicKey: this.paystackService.getPublicKey(),
      };
    }

    // Calculate commission using CommissionService
    const isContract =
      application.job.employmentArrangement === EmploymentArrangement.CONTRACT;
    const baseAmount = isContract
      ? application.job.contractFee
      : application.job.salary;

    if (!baseAmount) {
      throw new BadRequestException(
        'Job must have salary or contract fee defined',
      );
    }

    const commission = await this.commissionService.calculateCommissionFee(
      baseAmount,
      isContract,
    );

    // Generate payment reference
    const reference = this.paystackService.generateReference('ACT');

    // Create payment record
    const payment = this.paymentRepo.create({
      applicationId,
      employerId,
      amount: commission.totalAmount,
      percentage: commission.percentage * 100, // Store as percentage
      currency: 'NGN',
      status: PaymentStatus.PENDING,
      paymentType: PaymentType.EMPLOYEE_ACTIVATION_FEE,
      paystackReference: reference,
      metadata: {
        commissionBreakdown: commission,
        employmentArrangement: application.job.employmentArrangement,
        jobTitle: application.job.title,
        jobseekerName: `${application.jobseekerProfile.firstName} ${application.jobseekerProfile.lastName}`,
      },
    });

    const savedPayment = await this.paymentRepo.save(payment);

    // Initialize Paystack transaction
    const paystackResponse = await this.paystackService.initializeTransaction({
      email: application.job.employer.email,
      amount: this.paystackService.convertToKobo(commission.totalAmount),
      reference,
      currency: 'NGN',
      callback_url: callbackUrl,
      metadata: {
        paymentId: savedPayment.id,
        applicationId,
        employerId,
        paymentType: PaymentType.EMPLOYEE_ACTIVATION_FEE,
        commissionBreakdown: commission.breakdown,
      },
    });

    // Store the access_code so it can be reused if the user exits and retries
    await this.paymentRepo.update(savedPayment.id, {
      paystackAccessCode: paystackResponse.data.access_code,
    });

    this.logger.log(
      `Activation payment initiated for application ${applicationId}: ${savedPayment.id} (${commission.totalAmount})`,
    );

    return {
      paymentId: savedPayment.id,
      paymentUrl: paystackResponse.data.authorization_url,
      reference,
      accessCode: paystackResponse.data.access_code,
      publicKey: this.paystackService.getPublicKey(),
    };
  }

  /**
   * Process successful activation payment (called by webhook)
   */
  async processActivationPaymentSuccess(paymentId: string): Promise<void> {
    // Load payment with relations
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.paymentType !== PaymentType.EMPLOYEE_ACTIVATION_FEE) {
      throw new BadRequestException('Payment is not an activation payment');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      this.logger.warn(
        `Payment ${paymentId} already marked as successful. Skipping.`,
      );
      return;
    }

    // Update payment status
    await this.paymentRepo.update(paymentId, {
      status: PaymentStatus.SUCCESS,
      paidAt: new Date(),
    });

    // Handle new application-based PII unlock flow
    if (payment.applicationId) {
      await this.jobApplicationRepo.update(payment.applicationId, {
        piiUnlocked: true,
        piiUnlockedAt: new Date(),
      });

      this.logger.log(
        `Activation payment successful for application ${payment.applicationId}. PII unlocked.`,
      );

      this.eventEmitter.emit('application-pii-unlocked', {
        paymentId,
        applicationId: payment.applicationId,
        employerId: payment.employerId,
      });
    }

    // Handle legacy employee-based flow
    if (payment.employeeId) {
      await this.employeeRepo.update(payment.employeeId, {
        paymentStatus: EmployeePaymentStatus.PAID,
        piiUnlocked: true,
        activationBlocked: false,
      });

      // Find associated job application and update status
      const employee = await this.employeeRepo.findOne({
        where: { id: payment.employeeId },
      });

      if (employee) {
        const jobApplication = await this.jobApplicationRepo.findOne({
          where: {
            jobId: employee.jobId,
            jobseekerProfileId: employee.jobseekerProfileId,
          },
        });

        if (jobApplication) {
          await this.jobApplicationRepo.update(jobApplication.id, {
            status: JobApplicationStatus.PAYMENT_COMPLETE,
            statusUpdatedAt: new Date(),
          });
        }
      }

      this.logger.log(
        `Legacy activation payment successful for employee ${payment.employeeId}. PII unlocked.`,
      );

      // Emit event for contract generation
      this.eventEmitter.emit('employee-activation-payment.confirmed', {
        paymentId,
        employeeId: payment.employeeId,
        employerId: payment.employerId,
      });
    }
  }
}
