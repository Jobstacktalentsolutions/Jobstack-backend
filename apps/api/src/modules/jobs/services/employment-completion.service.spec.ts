import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Employee,
  EmployerProfile,
  JobApplication,
} from '@app/common/database/entities';
import {
  EmployeeStatus,
  ProbationStatus,
} from '@app/common/database/entities/schema.enum';
import { NotificationService } from '../../notification/notification.service';
import { EmploymentCompletionService } from './employment-completion.service';

describe('EmploymentCompletionService', () => {
  let service: EmploymentCompletionService;
  let mockEmpRepoInTx: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let employeeRepo: {
    findOne: jest.Mock;
    manager: { transaction: jest.Mock };
  };
  let applicationRepo: { findOne: jest.Mock };
  let employerRepo: { findOne: jest.Mock };
  let notificationService: {
    sendEmail: jest.Mock;
    createAppNotification: jest.Mock;
  };

  const employerId = 'emp-prof-1';
  const employeeId = 'employee-1';
  const jobseekerProfileId = 'js-1';
  const jobId = 'job-1';

  beforeEach(async () => {
    mockEmpRepoInTx = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation(async (e: Employee) => e),
    };

    employeeRepo = {
      findOne: jest.fn(),
      manager: {
        transaction: jest.fn(async (cb: (m: unknown) => Promise<void>) =>
          cb({
            getRepository: () => mockEmpRepoInTx,
          }),
        ),
      },
    };

    applicationRepo = { findOne: jest.fn() };
    employerRepo = { findOne: jest.fn() };

    notificationService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
      createAppNotification: jest.fn().mockResolvedValue(undefined),
    };

    const mockConfig = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmploymentCompletionService,
        { provide: getRepositoryToken(Employee), useValue: employeeRepo },
        {
          provide: getRepositoryToken(JobApplication),
          useValue: applicationRepo,
        },
        {
          provide: getRepositoryToken(EmployerProfile),
          useValue: employerRepo,
        },
        { provide: NotificationService, useValue: notificationService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(EmploymentCompletionService);
  });

  it('declareCompleteAsEmployer throws NotFound when missing', async () => {
    employeeRepo.findOne.mockResolvedValue(null);
    await expect(
      service.declareCompleteAsEmployer(employerId, employeeId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('declareCompleteAsEmployer throws when status is terminal', async () => {
    employeeRepo.findOne.mockResolvedValue({
      id: employeeId,
      employerId,
      status: EmployeeStatus.TERMINATED,
    });
    await expect(
      service.declareCompleteAsEmployer(employerId, employeeId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('declareCompleteAsEmployer notifies jobseeker when only employer declares', async () => {
    const base = {
      id: employeeId,
      employerId,
      jobId,
      jobseekerProfileId,
      status: EmployeeStatus.ACTIVE,
      employerDeclaredCompleteAt: null,
      jobseekerDeclaredCompleteAt: null,
      job: { title: 'Engineer' },
      jobseekerProfile: {
        email: 'js@test.com',
        firstName: 'Ada',
      },
    };

    const afterTx = {
      ...base,
      employerDeclaredCompleteAt: new Date(),
    };

    employeeRepo.findOne
      .mockResolvedValueOnce({ ...base })
      .mockResolvedValueOnce({ ...afterTx });

    mockEmpRepoInTx.findOne.mockResolvedValue({ ...base });

    applicationRepo.findOne.mockResolvedValue({ id: 'app-1' });

    await service.declareCompleteAsEmployer(employerId, employeeId);

    expect(notificationService.sendEmail).toHaveBeenCalled();
    expect(mockEmpRepoInTx.save).toHaveBeenCalled();
  });

  it('declareCompleteAsEmployer finalizes to ENDED when jobseeker already declared', async () => {
    const at = new Date();
    const base = {
      id: employeeId,
      employerId,
      jobId,
      jobseekerProfileId,
      status: EmployeeStatus.ACTIVE,
      employerDeclaredCompleteAt: null,
      jobseekerDeclaredCompleteAt: at,
      job: { title: 'Engineer' },
      jobseekerProfile: { email: 'js@test.com', firstName: 'Ada' },
      notes: null,
      probationStatus: ProbationStatus.ACTIVE,
      pulse30SentAt: null,
      pulse60SentAt: null,
    };

    const finalized = {
      ...base,
      status: EmployeeStatus.ENDED,
      employerDeclaredCompleteAt: new Date(),
      endDate: new Date(),
    };

    employeeRepo.findOne
      .mockResolvedValueOnce({ ...base })
      .mockResolvedValueOnce({ ...finalized });

    mockEmpRepoInTx.findOne.mockResolvedValue({ ...base });

    await service.declareCompleteAsEmployer(employerId, employeeId);

    expect(notificationService.sendEmail).not.toHaveBeenCalled();
    const saved = mockEmpRepoInTx.save.mock.calls[0][0] as Employee;
    expect(saved.status).toBe(EmployeeStatus.ENDED);
    expect(saved.endDate).toBeInstanceOf(Date);
  });
});
