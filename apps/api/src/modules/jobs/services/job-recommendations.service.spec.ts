import { Test, TestingModule } from '@nestjs/testing';
import { JobRecommendationsService } from './job-recommendations.service';

jest.mock('natural', () => ({
  JaroWinklerDistance: jest.fn(),
  SentimentAnalyzer: jest.fn(),
  PorterStemmer: jest.fn(),
}));

import { getRepositoryToken } from '@nestjs/typeorm';
import { JobSeekerProfile } from '@app/common/database/entities';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JobRecommendationsProcessor } from './job-recommendations.processor';
import { NotFoundException } from '@nestjs/common';

describe('JobRecommendationsService', () => {
  let service: JobRecommendationsService;
  let jobSeekerRepo: any;
  let cacheManager: any;
  let recommendationsProcessor: any;

  const mockJobSeekerRepo = {
    findOne: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockRecommendationsProcessor = {
    calculateRecommendations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobRecommendationsService,
        {
          provide: getRepositoryToken(JobSeekerProfile),
          useValue: mockJobSeekerRepo,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: JobRecommendationsProcessor,
          useValue: mockRecommendationsProcessor,
        },
      ],
    }).compile();

    service = module.get<JobRecommendationsService>(JobRecommendationsService);
    jobSeekerRepo = module.get(getRepositoryToken(JobSeekerProfile));
    cacheManager = module.get(CACHE_MANAGER);
    recommendationsProcessor = module.get(JobRecommendationsProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getJobRecommendations', () => {
    const jobSeekerId = 'jobseeker-123';
    const query = { page: 1, limit: 10, skipCache: false };

    it('should throw NotFoundException if job seeker profile does not exist', async () => {
      jobSeekerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getJobRecommendations(jobSeekerId, query),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return cached recommendations if available', async () => {
      const mockCached = [{ jobId: 'job-1', score: 0.9 }];
      jobSeekerRepo.findOne.mockResolvedValue({ id: jobSeekerId });
      cacheManager.get.mockResolvedValue(mockCached);

      const result = await service.getJobRecommendations(jobSeekerId, query);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(
        recommendationsProcessor.calculateRecommendations,
      ).not.toHaveBeenCalled();
      expect(result).toEqual(mockCached);
    });

    it('should calculate and cache recommendations if not in cache', async () => {
      const mockCalculated = [{ jobId: 'job-2', score: 0.8 }];
      jobSeekerRepo.findOne.mockResolvedValue({ id: jobSeekerId });
      cacheManager.get.mockResolvedValue(null);
      recommendationsProcessor.calculateRecommendations.mockResolvedValue(
        mockCalculated,
      );

      const result = await service.getJobRecommendations(jobSeekerId, query);

      expect(
        recommendationsProcessor.calculateRecommendations,
      ).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result).toEqual(mockCalculated);
    });

    it('should skip cache if skipCache is true', async () => {
      const mockCalculated = [{ jobId: 'job-3', score: 0.7 }];
      jobSeekerRepo.findOne.mockResolvedValue({ id: jobSeekerId });
      recommendationsProcessor.calculateRecommendations.mockResolvedValue(
        mockCalculated,
      );

      const result = await service.getJobRecommendations(jobSeekerId, {
        ...query,
        skipCache: true,
      });

      expect(cacheManager.get).not.toHaveBeenCalled();
      expect(
        recommendationsProcessor.calculateRecommendations,
      ).toHaveBeenCalled();
      expect(result).toEqual(mockCalculated);
    });
  });
});
