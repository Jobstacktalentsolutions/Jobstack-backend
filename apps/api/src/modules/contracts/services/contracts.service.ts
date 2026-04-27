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
  JobApplication,
} from '@app/common/database/entities';
import {
  ContractStatus,
  ContractTemplateType,
  DocumentType,
} from '@app/common/database/entities/schema.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StorageService } from '@app/common/storage';
import type { MulterFile } from '@app/common/shared/types';

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
    @InjectRepository(JobApplication)
    private readonly jobApplicationRepo: Repository<JobApplication>,
    private readonly eventEmitter: EventEmitter2,
    private readonly storageService: StorageService,
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
      relations: ['employer', 'jobseekerProfile', 'job', 'activationPayment'],
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
      this.logger.log(
        `Contract already exists for employee ${employeeId}, returning existing.`,
      );
      return existingContract;
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
    signatureImageFile?: MulterFile,
  ): Promise<Contract> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['employee', 'employee.employer', 'template'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Upload signature image to private S3 bucket and store the fileKey
    let signatureFileKey: string | undefined;
    if (signatureImageFile) {
      const upload = await this.storageService.uploadFile(signatureImageFile, {
        folder: 'contract-signatures',
        documentType: DocumentType.SIGNATURE,
        bucketType: 'private',
        uploadedBy: userId,
      });
      signatureFileKey = upload.fileKey;
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
      if (signatureFileKey) {
        contract.employerSignatureFileKey = signatureFileKey;
      }
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
      if (signatureFileKey) {
        contract.employeeSignatureFileKey = signatureFileKey;
      }

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

    // Re-render and update stored HTML so the signature images appear immediately
    if (contract.template && contract.metadata?.templateData) {
      const updatedHtml = await this.renderContractHtmlWithSignatures(contract);
      contract.metadata = { ...contract.metadata, html: updatedHtml };
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
      relations: [
        'employee',
        'employee.employer',
        'employee.jobseekerProfile',
        'template',
      ],
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
   * Get all contracts belonging to a jobseeker (via their employee records)
   */
  async getContractsByJobseekerId(
    jobseekerProfileId: string,
  ): Promise<Contract[]> {
    return this.contractRepo
      .createQueryBuilder('contract')
      .innerJoin('contract.employee', 'employee')
      .innerJoinAndSelect('contract.template', 'template')
      .leftJoinAndSelect('employee.employer', 'employer')
      .leftJoinAndSelect('employee.job', 'job')
      .where('employee.jobseekerProfileId = :jobseekerProfileId', {
        jobseekerProfileId,
      })
      .orderBy('contract.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get the contract for a specific job application (jobseeker-facing).
   * Looks up the application by ID, verifies ownership, then finds the
   * Employee record matching that job + jobseeker, and returns its contract.
   */
  async getContractsByApplicationId(
    applicationId: string,
    jobseekerProfileId: string,
  ): Promise<Contract[]> {
    const application = await this.jobApplicationRepo.findOne({
      where: { id: applicationId, jobseekerProfileId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const employee = await this.employeeRepo.findOne({
      where: {
        jobId: application.jobId,
        jobseekerProfileId: application.jobseekerProfileId,
      },
    });

    if (!employee) {
      return [];
    }

    return this.contractRepo.find({
      where: { employeeId: employee.id },
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
      .andWhere('contract.status != :cancelled', {
        cancelled: ContractStatus.CANCELLED,
      })
      .orderBy('contract.createdAt', 'DESC')
      .getMany();

    const contractByEmployee = new Map(contracts.map((c) => [c.employeeId, c]));

    return employees.map((e) => ({
      ...e,
      contract: contractByEmployee.get(e.id) ?? null,
    }));
  }

  /**
   * Get all contracts (admin view)
   */
  async getAllContracts(): Promise<Contract[]> {
    return this.contractRepo
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.template', 'template')
      .leftJoinAndSelect('contract.employee', 'employee')
      .leftJoinAndSelect('employee.jobseekerProfile', 'jobseekerProfile')
      .leftJoinAndSelect('employee.employer', 'employer')
      .leftJoinAndSelect('employee.job', 'job')
      .orderBy('contract.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Cancel (void) a contract — admin action
   */
  async cancelContract(contractId: string, reason?: string): Promise<Contract> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: [
        'employee',
        'employee.employer',
        'employee.jobseekerProfile',
        'template',
      ],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status === ContractStatus.CANCELLED) {
      throw new BadRequestException('Contract is already cancelled');
    }

    contract.status = ContractStatus.CANCELLED;
    if (reason) {
      contract.notes = reason;
    }

    await this.contractRepo.save(contract);

    this.logger.log(
      `Contract ${contractId} cancelled by admin. Reason: ${reason ?? 'N/A'}`,
    );

    return contract;
  }

  /**
   * Cancel (void) a contract — employer action (only if not fully executed)
   */
  async cancelContractForEmployer(
    contractId: string,
    employerId: string,
    reason?: string,
  ): Promise<Contract> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: [
        'employee',
        'employee.employer',
        'employee.jobseekerProfile',
        'template',
      ],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.employee?.employerId !== employerId) {
      throw new BadRequestException('You do not have access to this contract');
    }

    if (contract.status === ContractStatus.CANCELLED) {
      throw new BadRequestException('Contract is already cancelled');
    }

    if (contract.status === ContractStatus.FULLY_EXECUTED) {
      throw new BadRequestException('Cannot cancel a fully executed contract');
    }

    contract.status = ContractStatus.CANCELLED;
    if (reason) {
      contract.notes = reason;
    }

    await this.contractRepo.save(contract);

    this.logger.log(
      `Contract ${contractId} cancelled by employer ${employerId}. Reason: ${
        reason ?? 'N/A'
      }`,
    );

    return contract;
  }

  /**
   * Return contract HTML — always re-renders with fresh signed URLs for signature images
   */
  async getContractHtml(contractId: string): Promise<string> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['template'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (!contract.template) {
      throw new NotFoundException('Contract template not found');
    }

    return this.renderContractHtmlWithSignatures(contract);
  }

  /**
   * Render contract HTML, injecting fresh signed URLs for any uploaded signature images
   */
  private async renderContractHtmlWithSignatures(
    contract: Contract,
  ): Promise<string> {
    const templateData: Record<string, any> = {
      ...(contract.metadata?.templateData ?? {}),
    };

    // Inject live signature metadata from the entity (not stored in templateData)
    if (contract.employerSignedAt) {
      templateData.employerSignedAt = new Date(
        contract.employerSignedAt,
      ).toLocaleDateString('en-GB');
      templateData.employerSignatureIp = contract.employerSignatureIp ?? '';
    }
    if (contract.employeeSignedAt) {
      templateData.employeeSignedAt = new Date(
        contract.employeeSignedAt,
      ).toLocaleDateString('en-GB');
      templateData.employeeSignatureIp = contract.employeeSignatureIp ?? '';
    }

    // Inject fresh signed URLs for signature images (1-hour expiry)
    if (contract.employerSignatureFileKey) {
      templateData.employerSignatureImageUrl =
        await this.storageService.getSignedUrl(
          contract.employerSignatureFileKey,
          3600,
          false,
          'private',
        );
    }
    if (contract.employeeSignatureFileKey) {
      templateData.employeeSignatureImageUrl =
        await this.storageService.getSignedUrl(
          contract.employeeSignatureFileKey,
          3600,
          false,
          'private',
        );
    }

    if (!contract.template) {
      throw new NotFoundException('Contract template not found');
    }

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
