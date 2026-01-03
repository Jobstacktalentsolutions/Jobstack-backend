import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { 
  Payment, 
  Employee, 
  EmployerProfile,
  SystemConfig 
} from '@app/common/database/entities';
import { 
  PaymentStatus, 
  PaymentType, 
  EmploymentArrangement,
  EmployeePaymentStatus 
} from '@app/common/database/entities/schema.enum';
import { PaystackService } from './paystack.service';
import { SystemConfigService } from './system-config.service';
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
    private readonly paystackService: PaystackService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  // Calculate payment amount based on employment arrangement
  async calculatePaymentAmount(employee: Employee): Promise<PaymentCalculationResult> {
    const percentage = await this.systemConfigService.getEmployeeActivationPercentage();
    
    let baseAmount: number;
    let paymentType: PaymentType;

    if (employee.employmentArrangement === EmploymentArrangement.CONTRACT) {
      if (!employee.contractFeeOffered) {
        throw new BadRequestException('Contract fee is required for contract employees');
      }
      baseAmount = employee.contractFeeOffered;
      paymentType = PaymentType.CONTRACT_ACTIVATION;
    } else if (employee.employmentArrangement === EmploymentArrangement.PERMANENT_EMPLOYEE) {
      if (!employee.salaryOffered) {
        throw new BadRequestException('Salary is required for permanent employees');
      }
      baseAmount = employee.salaryOffered;
      paymentType = PaymentType.EMPLOYEE_ACTIVATION;
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
      paymentType,
    };
  }

  // Initiate payment for employee activation
  async initiatePayment(params: InitiatePaymentParams): Promise<{ paymentId: string; paymentUrl: string; reference: string }> {
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
      throw new BadRequestException('Payment already initiated for this employee');
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
      paymentId: savedPayment.id,
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

    this.logger.log(`Payment initiated for employee ${params.employeeId}: ${savedPayment.id}`);

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
    const paystackResponse = await this.paystackService.verifyTransaction(reference);
    
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
    const employeePaymentStatus = status === PaymentStatus.SUCCESS 
      ? EmployeePaymentStatus.PAID 
      : EmployeePaymentStatus.FAILED;

    await this.employeeRepo.update(payment.employeeId, {
      paymentStatus: employeePaymentStatus,
      activationBlocked: status !== PaymentStatus.SUCCESS,
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
  async checkPaymentStatus(employeeId: string): Promise<{ required: boolean; completed: boolean; paymentId?: string }> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if payment is required (has salary or contract fee)
    const hasPaymentAmount = employee.salaryOffered || employee.contractFeeOffered;
    
    if (!hasPaymentAmount) {
      return { required: false, completed: true };
    }

    const required = true;
    const completed = employee.paymentStatus === EmployeePaymentStatus.PAID;

    return {
      required,
      completed,
      paymentId: employee.paymentId,
    };
  }

  // Get payment history for employer/employee
  async getPaymentHistory(query: PaymentHistoryQuery): Promise<PaymentHistoryResult> {
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
  async getPaymentById(paymentId: string, employerId?: string): Promise<Payment> {
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
        await this.verifyPayment(reference);
        this.logger.log(`Webhook processed successfully for reference: ${reference}`);
      } catch (error) {
        this.logger.error(`Failed to process webhook for reference ${reference}: ${error.message}`);
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
  private applyPaymentFilters(qb: SelectQueryBuilder<Payment>, query: PaymentHistoryQuery): void {
    if (query.employerId) {
      qb.andWhere('payment.employerId = :employerId', { employerId: query.employerId });
    }

    if (query.employeeId) {
      qb.andWhere('payment.employeeId = :employeeId', { employeeId: query.employeeId });
    }

    if (query.status) {
      qb.andWhere('payment.status = :status', { status: query.status });
    }

    if (query.paymentType) {
      qb.andWhere('payment.paymentType = :paymentType', { paymentType: query.paymentType });
    }
  }
}
