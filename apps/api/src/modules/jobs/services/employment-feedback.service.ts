import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Employee, EmploymentFeedback } from '@app/common/database/entities';
import {
  EmployeeStatus,
  EmploymentFeedbackReviewerRole,
} from '@app/common/database/entities/schema.enum';
import { SubmitEmploymentFeedbackDto } from '../dto';

@Injectable()
export class EmploymentFeedbackService {
  constructor(
    @InjectRepository(EmploymentFeedback)
    private readonly feedbackRepo: Repository<EmploymentFeedback>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  // Persists employer-side feedback inside the caller's transaction.
  async createEmployerFeedbackWithManager(
    manager: EntityManager,
    employeeId: string,
    rating: number,
    comment?: string | null,
  ): Promise<void> {
    const repo = manager.getRepository(EmploymentFeedback);
    await repo.save(
      repo.create({
        employeeId,
        reviewerRole: EmploymentFeedbackReviewerRole.EMPLOYER,
        rating,
        comment: comment?.trim() || null,
      }),
    );
  }

  // True when jobseeker may submit their feedback row.
  private jobseekerMayRate(employee: Employee): boolean {
    return (
      employee.jobseekerDeclaredCompleteAt != null ||
      employee.status === EmployeeStatus.TERMINATED ||
      employee.status === EmployeeStatus.COMPLETED ||
      employee.status === EmployeeStatus.ENDED
    );
  }

  // True when employer may submit their feedback row (outside termination txn).
  private employerMayRate(employee: Employee): boolean {
    return (
      employee.employerDeclaredCompleteAt != null ||
      employee.status === EmployeeStatus.TERMINATED
    );
  }

  // Jobseeker submits one-time feedback for a ended or declared-complete employment.
  async submitJobseekerFeedback(
    jobseekerProfileId: string,
    employeeId: string,
    dto: SubmitEmploymentFeedbackDto,
  ): Promise<EmploymentFeedback> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, jobseekerProfileId },
    });
    if (!employee) {
      throw new NotFoundException('Employment record not found');
    }
    if (!this.jobseekerMayRate(employee)) {
      throw new BadRequestException(
        'Feedback is available after you declare completion or once employment has ended.',
      );
    }

    const existing = await this.feedbackRepo.findOne({
      where: {
        employeeId,
        reviewerRole: EmploymentFeedbackReviewerRole.JOBSEEKER,
      },
    });
    if (existing) {
      throw new ConflictException(
        'You have already submitted feedback for this employment.',
      );
    }

    return this.feedbackRepo.save(
      this.feedbackRepo.create({
        employeeId,
        reviewerRole: EmploymentFeedbackReviewerRole.JOBSEEKER,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      }),
    );
  }

  // Employer submits one-time feedback after declaring completion or termination path.
  async submitEmployerFeedback(
    employerId: string,
    employeeId: string,
    dto: SubmitEmploymentFeedbackDto,
  ): Promise<EmploymentFeedback> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, employerId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (!this.employerMayRate(employee)) {
      throw new BadRequestException(
        'Feedback is available after you declare completion or end employment.',
      );
    }

    const existing = await this.feedbackRepo.findOne({
      where: {
        employeeId,
        reviewerRole: EmploymentFeedbackReviewerRole.EMPLOYER,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Employer feedback has already been submitted for this employment.',
      );
    }

    return this.feedbackRepo.save(
      this.feedbackRepo.create({
        employeeId,
        reviewerRole: EmploymentFeedbackReviewerRole.EMPLOYER,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      }),
    );
  }

  // Returns jobseeker's own feedback row if any (for application / detail UI).
  async getJobseekerFeedbackForEmployee(
    jobseekerProfileId: string,
    employeeId: string,
  ): Promise<EmploymentFeedback | null> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, jobseekerProfileId },
    });
    if (!employee) {
      throw new NotFoundException('Employment record not found');
    }

    return this.feedbackRepo.findOne({
      where: {
        employeeId,
        reviewerRole: EmploymentFeedbackReviewerRole.JOBSEEKER,
      },
    });
  }

  // Returns employer's own feedback row if any.
  async getEmployerFeedbackForEmployee(
    employerId: string,
    employeeId: string,
  ): Promise<EmploymentFeedback | null> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, employerId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.feedbackRepo.findOne({
      where: {
        employeeId,
        reviewerRole: EmploymentFeedbackReviewerRole.EMPLOYER,
      },
    });
  }
}
