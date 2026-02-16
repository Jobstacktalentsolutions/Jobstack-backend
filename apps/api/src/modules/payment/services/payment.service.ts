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

    // Update payment record
    await this.paymentRepo.update(payment.id, {
      status,
      paidAt,
      paystackTransactionId: paystackResponse.data.id.toString(),
    });

    // Update employee payment status
    const employeePaymentStatus =
      status === PaymentStatus.SUCCESS
        ? EmployeePaymentStatus.PAID
        : EmployeePaymentStatus.FAILED;

    await this.employeeRepo.update(payment.employeeId, {
      paymentStatus: employeePaymentStatus,
      activationBlocked: status !== PaymentStatus.SUCCESS,
      piiUnlocked: status === PaymentStatus.SUCCESS, // Unlock PII when payment succeeds
    });

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

  // Check if payment is required and completed for employee activation
  async checkPaymentStatus(
    employeeId: string,
  ): Promise<{ required: boolean; completed: boolean; paymentId?: string }> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if payment is required (has salary or contract fee)
    const hasPaymentAmount =
      employee.salaryOffered || employee.contractFeeOffered;

    if (!hasPaymentAmount) {
      return { required: false, completed: true };
    }

    const required = true;
    const completed = employee.paymentStatus === EmployeePaymentStatus.PAID;

    return {
      required,
      completed,
      paymentId: employee.activationPaymentId,
    };
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
   * Initiate employee activation payment with commission calculation
   */
  async initiateActivationPayment(
    employeeId: string,
    employerId: string,
    callbackUrl?: string,
  ): Promise<{ paymentId: string; paymentUrl: string; reference: string }> {
    // Load employee with relations
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, employerId },
      relations: ['employer', 'job', 'jobseekerProfile'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Validate status
    if (employee.status !== EmployeeStatus.ONBOARDING) {
      throw new BadRequestException(
        `Employee must be in ONBOARDING status. Current status: ${employee.status}`,
      );
    }

    // Validate PII not already unlocked
    if (employee.piiUnlocked) {
      throw new BadRequestException('Employee PII already unlocked');
    }

    // Check for existing pending payment
    const existingPayment = await this.paymentRepo.findOne({
      where: {
        employeeId,
        paymentType: PaymentType.EMPLOYEE_ACTIVATION_FEE,
        status: PaymentStatus.PENDING,
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        'Payment already initiated for this employee',
      );
    }

    // Calculate commission using CommissionService
    const isContract =
      employee.employmentArrangement === EmploymentArrangement.CONTRACT;
    const baseAmount = isContract
      ? employee.contractFeeOffered
      : employee.salaryOffered;

    if (!baseAmount) {
      throw new BadRequestException(
        'Employee must have salary or contract fee defined',
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
      employeeId,
      employerId,
      amount: commission.totalAmount,
      percentage: commission.percentage * 100, // Store as percentage
      currency: employee.currency || 'NGN',
      status: PaymentStatus.PENDING,
      paymentType: PaymentType.EMPLOYEE_ACTIVATION_FEE,
      paystackReference: reference,
      metadata: {
        commissionBreakdown: commission,
        employmentArrangement: employee.employmentArrangement,
        jobTitle: employee.job.title,
        employeeName: `${employee.jobseekerProfile.firstName} ${employee.jobseekerProfile.lastName}`,
      },
    });

    const savedPayment = await this.paymentRepo.save(payment);

    // Update employee
    await this.employeeRepo.update(employeeId, {
      paymentStatus: EmployeePaymentStatus.PENDING,
      activationPaymentId: savedPayment.id,
    });

    // Initialize Paystack transaction
    const paystackResponse = await this.paystackService.initializeTransaction({
      email: employee.employer.email,
      amount: this.paystackService.convertToKobo(commission.totalAmount),
      reference,
      currency: employee.currency || 'NGN',
      callback_url: callbackUrl,
      metadata: {
        paymentId: savedPayment.id,
        employeeId,
        employerId,
        paymentType: PaymentType.EMPLOYEE_ACTIVATION_FEE,
        commissionBreakdown: commission.breakdown,
      },
    });

    this.logger.log(
      `Activation payment initiated for employee ${employeeId}: ${savedPayment.id} (${commission.totalAmount})`,
    );

    return {
      paymentId: savedPayment.id,
      paymentUrl: paystackResponse.data.authorization_url,
      reference,
    };
  }

  /**
   * Process successful activation payment (called by webhook)
   */
  async processActivationPaymentSuccess(paymentId: string): Promise<void> {
    // Load payment with relations
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['employee'],
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

    // Update employee - unlock PII and mark payment as paid
    await this.employeeRepo.update(payment.employeeId, {
      paymentStatus: EmployeePaymentStatus.PAID,
      piiUnlocked: true,
      activationBlocked: false,
    });

    // Find associated job application and update status
    const jobApplication = await this.jobApplicationRepo.findOne({
      where: {
        jobId: payment.employee.jobId,
        jobseekerProfileId: payment.employee.jobseekerProfileId,
      },
    });

    if (jobApplication) {
      await this.jobApplicationRepo.update(jobApplication.id, {
        status: JobApplicationStatus.HIRED,
        statusUpdatedAt: new Date(),
      });
    }

    this.logger.log(
      `Activation payment successful for employee ${payment.employeeId}. PII unlocked.`,
    );

    // Emit event for contract generation
    this.eventEmitter.emit('employee-activation-payment.confirmed', {
      paymentId,
      employeeId: payment.employeeId,
      employerId: payment.employerId,
    });
  }
}
