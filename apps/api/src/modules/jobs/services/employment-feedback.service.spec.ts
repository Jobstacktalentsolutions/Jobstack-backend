import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee, EmploymentFeedback } from '@app/common/database/entities';
import { EmployeeStatus } from '@app/common/database/entities/schema.enum';
import { EmploymentFeedbackService } from './employment-feedback.service';

describe('EmploymentFeedbackService', () => {
  let service: EmploymentFeedbackService;
  let feedbackRepo: jest.Mocked<
    Pick<Repository<EmploymentFeedback>, 'findOne' | 'save' | 'create'>
  >;
  let employeeRepo: jest.Mocked<Pick<Repository<Employee>, 'findOne'>>;

  beforeEach(async () => {
    feedbackRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((x) => x as EmploymentFeedback),
    };
    employeeRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmploymentFeedbackService,
        {
          provide: getRepositoryToken(EmploymentFeedback),
          useValue: feedbackRepo,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepo,
        },
      ],
    }).compile();

    service = module.get(EmploymentFeedbackService);
  });

  it('submitJobseekerFeedback throws NotFound when employee not owned', async () => {
    employeeRepo.findOne.mockResolvedValue(null);
    await expect(
      service.submitJobseekerFeedback('profile-1', 'emp-1', {
        rating: 4,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('submitJobseekerFeedback throws BadRequest when still active', async () => {
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      jobseekerProfileId: 'profile-1',
      status: EmployeeStatus.ACTIVE,
    } as Employee);
    await expect(
      service.submitJobseekerFeedback('profile-1', 'emp-1', {
        rating: 4,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('submitJobseekerFeedback throws Conflict when already submitted', async () => {
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      jobseekerProfileId: 'profile-1',
      status: EmployeeStatus.TERMINATED,
    } as Employee);
    feedbackRepo.findOne.mockResolvedValue({ id: 'f1' } as EmploymentFeedback);

    await expect(
      service.submitJobseekerFeedback('profile-1', 'emp-1', {
        rating: 5,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('submitJobseekerFeedback saves when eligible', async () => {
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      jobseekerProfileId: 'profile-1',
      status: EmployeeStatus.COMPLETED,
    } as Employee);
    feedbackRepo.findOne.mockResolvedValue(null);
    const saved = { id: 'f-new', rating: 5 } as EmploymentFeedback;
    feedbackRepo.save.mockResolvedValue(saved);

    const result = await service.submitJobseekerFeedback('profile-1', 'emp-1', {
      rating: 5,
      comment: ' great ',
    });

    expect(result).toBe(saved);
    expect(feedbackRepo.save).toHaveBeenCalled();
  });

  it('submitJobseekerFeedback allows ACTIVE when jobseeker has declared completion', async () => {
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      jobseekerProfileId: 'profile-1',
      status: EmployeeStatus.ACTIVE,
      jobseekerDeclaredCompleteAt: new Date(),
    } as Employee);
    feedbackRepo.findOne.mockResolvedValue(null);
    const saved = { id: 'f-new', rating: 4 } as EmploymentFeedback;
    feedbackRepo.save.mockResolvedValue(saved);

    const result = await service.submitJobseekerFeedback('profile-1', 'emp-1', {
      rating: 4,
    });

    expect(result).toBe(saved);
  });

  it('submitEmployerFeedback rejects when employer has not declared and still active', async () => {
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      employerId: 'eprof-1',
      status: EmployeeStatus.ACTIVE,
      employerDeclaredCompleteAt: null,
    } as Employee);

    await expect(
      service.submitEmployerFeedback('eprof-1', 'emp-1', { rating: 4 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('submitEmployerFeedback saves when employer declared completion', async () => {
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      employerId: 'eprof-1',
      status: EmployeeStatus.ACTIVE,
      employerDeclaredCompleteAt: new Date(),
    } as Employee);
    feedbackRepo.findOne.mockResolvedValue(null);
    const saved = { id: 'f-emp', rating: 5 } as EmploymentFeedback;
    feedbackRepo.save.mockResolvedValue(saved);

    const result = await service.submitEmployerFeedback('eprof-1', 'emp-1', {
      rating: 5,
    });

    expect(result).toBe(saved);
  });
});
