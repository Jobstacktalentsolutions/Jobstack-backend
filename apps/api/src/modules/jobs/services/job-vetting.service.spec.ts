import { Test, TestingModule } from '@nestjs/testing';
import { JobVettingService } from './job-vetting.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Job,
  JobApplication,
  JobSeekerProfile,
  Employee,
  EmployerProfile,
} from '@app/common/database/entities';
import { NotificationService } from '../../notification/notification.service';

describe('JobVettingService', () => {
  let service: JobVettingService;
  let jobRepo: any;
  let applicationRepo: any;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockNotificationService = {
    sendEmail: jest.fn(),
    createAppNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobVettingService,
        { provide: getRepositoryToken(Job), useValue: mockRepository },
        {
          provide: getRepositoryToken(JobApplication),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(JobSeekerProfile),
          useValue: mockRepository,
        },
        { provide: getRepositoryToken(Employee), useValue: mockRepository },
        {
          provide: getRepositoryToken(EmployerProfile),
          useValue: mockRepository,
        },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<JobVettingService>(JobVettingService);
    jobRepo = module.get(getRepositoryToken(Job));
    applicationRepo = module.get(getRepositoryToken(JobApplication));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('vetJobApplications', () => {
    const jobId = 'job-123';

    it('should throw error if job not found', async () => {
      jobRepo.findOne.mockResolvedValue(null);

      await expect(service.vetJobApplications(jobId)).rejects.toThrow(
        `Job ${jobId} not found`,
      );
    });

    it('should return empty result if no applications found', async () => {
      jobRepo.findOne.mockResolvedValue({
        id: jobId,
        skills: [],
        applications: [],
      });
      applicationRepo.find.mockResolvedValue([]);

      const result = await service.vetJobApplications(jobId);

      expect(result.totalApplicants).toBe(0);
      expect(result.vettedApplicants).toEqual([]);
    });
  });
});
