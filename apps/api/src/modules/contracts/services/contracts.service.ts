import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as Handlebars from 'handlebars';
import {
  Contract,
  ContractTemplate,
  Employee,
} from '@app/common/database/entities';
import {
  ContractStatus,
  ContractTemplateType,
} from '@app/common/database/entities/schema.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);
  private readonly templateCache = new Map<
    string,
    Handlebars.TemplateDelegate
  >();

  constructor(
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(ContractTemplate)
    private readonly templateRepo: Repository<ContractTemplate>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
  }

  /**
   * Get all available contract templates
   */
  async getAvailableTemplates(): Promise<ContractTemplate[]> {
    return this.templateRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Get a specific template by ID
   */
  async getTemplateById(templateId: string): Promise<ContractTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Contract template not found');
    }

    return template;
  }

  /**
   * Generate employment contract from template
   */
  async generateEmploymentContract(
    employeeId: string,
    templateId?: string,
  ): Promise<Contract> {
    // Load employee with all relations
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: [
        'employer',
        'jobseekerProfile',
        'job',
        'activationPayment',
      ],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Determine template based on employment arrangement if not specified
    let template: ContractTemplate;
    if (templateId) {
      template = await this.getTemplateById(templateId);
    } else {
      template = await this.getDefaultTemplateForEmployee(employee);
    }

    // Check if contract already exists
    const existingContract = await this.contractRepo.findOne({
      where: { employeeId: employee.id },
    });

    if (
      existingContract &&
      existingContract.status !== ContractStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Contract already exists for this employee',
      );
    }

    // Prepare template data for rendering
    const templateData = await this.prepareTemplateData(employee);

    // Render template HTML and store it directly — no PDF/storage needed
    const htmlContent = await this.renderTemplate(template, templateData);

    // Create Contract record with HTML stored in metadata
    const contract = this.contractRepo.create({
      employeeId: employee.id,
      templateId: template.id,
      templateVersion: template.version,
      status: ContractStatus.PENDING_SIGNATURES,
      metadata: {
        generatedAt: new Date().toISOString(),
        templateData,
        html: htmlContent,
      },
    });

    const savedContract = await this.contractRepo.save(contract);

    this.logger.log(
      `Contract generated for employee ${employeeId}: ${savedContract.id}`,
    );

    // Emit event
    this.eventEmitter.emit('contract.generated', {
      contractId: savedContract.id,
      employeeId,
    });

    const fullContract = await this.contractRepo.findOne({
      where: { id: savedContract.id },
      relations: ['employee', 'template'],
    });

    if (!fullContract) {
      throw new NotFoundException('Generated contract not found');
    }

    return fullContract;
  }

  /**
   * Sign contract (employer or employee)
   */
  async signContract(
    contractId: string,
    userId: string,
    userType: 'employer' | 'employee',
    ipAddress: string,
  ): Promise<Contract> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['employee', 'employee.employer'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Update signature fields
    const now = new Date();
    if (userType === 'employer') {
      if (contract.employerSignedAt) {
        throw new BadRequestException(
          'Employer has already signed this contract',
        );
      }
      contract.employerSignedAt = now;
      contract.employerSignatureIp = ipAddress;
      contract.employerSignedById = userId;
      contract.status = ContractStatus.EMPLOYER_SIGNED;
    } else {
      if (contract.employeeSignedAt) {
        throw new BadRequestException(
          'Employee has already signed this contract',
        );
      }
      contract.employeeSignedAt = now;
      contract.employeeSignatureIp = ipAddress;
      contract.employeeSignedById = userId;

      // Update status based on employer signature
      if (contract.employerSignedAt) {
        contract.status = ContractStatus.FULLY_EXECUTED;
      } else {
        contract.status = ContractStatus.EMPLOYEE_SIGNED;
      }
    }

    // Check if both parties have signed
    if (contract.employerSignedAt && contract.employeeSignedAt) {
      contract.status = ContractStatus.FULLY_EXECUTED;

      // Emit event for fully executed contract
      this.eventEmitter.emit('contract.fully-executed', {
        contractId: contract.id,
        employeeId: contract.employeeId,
      });
    }

    await this.contractRepo.save(contract);

    this.logger.log(
      `Contract ${contractId} signed by ${userType} (${userId}). Status: ${contract.status}`,
    );

    return contract;
  }

  /**
   * Get contract by ID
   */
  async getContractById(contractId: string): Promise<Contract> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['employee', 'employee.employer', 'employee.jobseekerProfile', 'template'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  /**
   * Get contracts for an employee
   */
  async getContractsByEmployeeId(employeeId: string): Promise<Contract[]> {
    return this.contractRepo.find({
      where: { employeeId },
      relations: ['template'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all contracts for an employer (across all their employees)
   */
  async getContractsByEmployerId(
    employerId: string,
  ): Promise<Array<Employee & { contract: Contract | null }>> {
    // Fetch all paid employees for this employer
    const employees = await this.employeeRepo
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.jobseekerProfile', 'jobseekerProfile')
      .leftJoinAndSelect('employee.job', 'job')
      .where('employee.employerId = :employerId', { employerId })
      .andWhere('employee.piiUnlocked = true')
      .orderBy('employee.createdAt', 'DESC')
      .getMany();

    if (employees.length === 0) return [];

    // Fetch contracts for these employees in one query
    const employeeIds = employees.map((e) => e.id);
    const contracts = await this.contractRepo
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.template', 'template')
      .where('contract.employeeId IN (:...employeeIds)', { employeeIds })
      .orderBy('contract.createdAt', 'DESC')
      .getMany();

    const contractByEmployee = new Map(contracts.map((c) => [c.employeeId, c]));

    return employees.map((e) => ({
      ...e,
      contract: contractByEmployee.get(e.id) ?? null,
    }));
  }

  /**
   * Return contract HTML — serves stored HTML from metadata, re-renders as fallback
   */
  async getContractHtml(contractId: string): Promise<string> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['template'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Serve stored HTML directly (fast path)
    if (contract.metadata?.html) {
      return contract.metadata.html as string;
    }

    // Fallback: re-render from stored template data
    if (!contract.template) {
      throw new NotFoundException('Contract template not found');
    }

    const templateData = contract.metadata?.templateData ?? {};
    return this.renderTemplate(contract.template, templateData);
  }

  /**
   * Render Handlebars template with data
   */
  private async renderTemplate(
    template: ContractTemplate,
    data: Record<string, any>,
  ): Promise<string> {
    // Cheeck cache
    let compiledTemplate = this.templateCache.get(template.id);

    if (!compiledTemplate) {
      // Load template file
      const templatePath = join(
        process.cwd(),
        'apps/api/src/templates',
        template.templatePath,
      );

      try {
        const templateContent = await readFile(templatePath, 'utf-8');
        compiledTemplate = Handlebars.compile(templateContent);
        this.templateCache.set(template.id, compiledTemplate);
      } catch (error) {
        this.logger.error(
          `Failed to load template ${templatePath}: ${error.message}`,
        );
        throw new BadRequestException('Failed to load contract template');
      }
    }

    return compiledTemplate(data);
  }

  /**
   * Prepare template data from employee entity
   */
  private async prepareTemplateData(
    employee: Employee,
  ): Promise<Record<string, any>> {
    const employer = employee.employer;
    const jobseeker = employee.jobseekerProfile;
    const job = employee.job;

    return {
      contractId: `JOB-${employee.id.substring(0, 8).toUpperCase()}`,
      issueDate: new Date().toLocaleDateString('en-GB'),

      // Employer details
      employerName: `${employer.firstName} ${employer.lastName}`,
      employerAddress: employer.address || 'N/A',
      employerEmail: employer.email,

      // Employee details
      employeeName: jobseeker
        ? `${jobseeker.firstName} ${jobseeker.lastName}`
        : 'N/A',
      employeeAddress: jobseeker?.address || 'N/A',
      employeeEmail: jobseeker?.email || 'N/A',
      employeePhone: jobseeker?.phoneNumber || 'N/A',

      // Job details
      jobTitle: job.title,
      jobDescription: job.description || 'As discussed',
      employmentType: employee.employmentType,
      employmentArrangement: employee.employmentArrangement,
      workMode: job.workMode,

      // Compensation — TypeORM returns decimals as strings, so parse before arithmetic
      salary: employee.salaryOffered
        ? parseFloat(String(employee.salaryOffered)).toLocaleString()
        : 'N/A',
      annualSalary: employee.salaryOffered
        ? (parseFloat(String(employee.salaryOffered)) * 12).toLocaleString()
        : 'N/A',
      contractFee: employee.contractFeeOffered
        ? parseFloat(String(employee.contractFeeOffered)).toLocaleString()
        : 'N/A',
      contractPaymentType: employee.contractPaymentType || 'N/A',
      currency: employee.currency || 'NGN',

      // Dates
      startDate: employee.startDate
        ? new Date(employee.startDate).toLocaleDateString('en-GB')
        : 'To be determined',
      endDate: employee.endDate
        ? new Date(employee.endDate).toLocaleDateString('en-GB')
        : 'N/A',
      contractDuration: this.calculateDuration(
        employee.startDate,
        employee.endDate,
      ),

      // Signature info (if already signed)
      employerSignedAt: employee.createdAt
        ? new Date(employee.createdAt).toLocaleDateString('en-GB')
        : null,
      employeeSignedAt: null,
    };
  }

  /**
   * Get default template based on employee's employment arrangement
   */
  private async getDefaultTemplateForEmployee(
    employee: Employee,
  ): Promise<ContractTemplate> {
    let templateType: ContractTemplateType;

    if (employee.employmentArrangement === 'PERMANENT_EMPLOYEE') {
      templateType = ContractTemplateType.PERMANENT_EMPLOYMENT;
    } else {
      templateType = ContractTemplateType.FIXED_TERM_CONTRACT;
    }

    const template = await this.templateRepo.findOne({
      where: { type: templateType, isActive: true },
      order: { displayOrder: 'ASC' },
    });

    if (!template) {
      throw new NotFoundException(
        `No active template found for ${templateType}`,
      );
    }

    return template;
  }

  /**
   * Calculate duration between two dates
   */
  private calculateDuration(startDate?: Date, endDate?: Date): string {
    if (!startDate || !endDate) {
      return 'Permanent';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;

    if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}${days > 0 ? ` ${days} day${days > 1 ? 's' : ''}` : ''}`;
    }

    return `${days} day${days > 1 ? 's' : ''}`;
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    // Helper for conditional rendering
    Handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });

    // Helper for date formatting
    Handlebars.registerHelper('formatDate', function (date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-GB');
    });

    // Helper for currency formatting
    Handlebars.registerHelper('currency', function (amount, currency = 'NGN') {
      if (!amount) return 'N/A';
      return `${currency} ${parseFloat(amount).toLocaleString()}`;
    });
  }
}
