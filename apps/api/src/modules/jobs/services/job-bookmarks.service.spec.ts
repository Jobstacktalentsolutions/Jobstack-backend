import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobBookmark } from '@app/common/database/entities';
import { JobStatus } from '@app/common/database/entities/schema.enum';
import { JobBookmarksService } from './job-bookmarks.service';

describe('JobBookmarksService', () => {
  let service: JobBookmarksService;
  let bookmarkRepo: jest.Mocked<
    Pick<
      Repository<JobBookmark>,
      'findOne' | 'find' | 'save' | 'delete' | 'create' | 'createQueryBuilder'
    >
  >;
  let jobRepo: jest.Mocked<Pick<Repository<Job>, 'findOne'>>;

  beforeEach(async () => {
    bookmarkRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((x) => x as JobBookmark),
      createQueryBuilder: jest.fn(),
    };
    jobRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobBookmarksService,
        {
          provide: getRepositoryToken(JobBookmark),
          useValue: bookmarkRepo,
        },
        {
          provide: getRepositoryToken(Job),
          useValue: jobRepo,
        },
      ],
    }).compile();

    service = module.get(JobBookmarksService);
  });

  it('add is a no-op when bookmark already exists', async () => {
    bookmarkRepo.findOne.mockResolvedValue({ id: 'b1' } as JobBookmark);
    await service.add('profile-1', 'job-1');
    expect(jobRepo.findOne).not.toHaveBeenCalled();
    expect(bookmarkRepo.save).not.toHaveBeenCalled();
  });

  it('add throws NotFound when job missing', async () => {
    bookmarkRepo.findOne.mockResolvedValue(null);
    jobRepo.findOne.mockResolvedValue(null);
    await expect(service.add('profile-1', 'job-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('add throws BadRequest when job is not marketplace-open', async () => {
    bookmarkRepo.findOne.mockResolvedValue(null);
    jobRepo.findOne.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.CLOSED,
    } as Job);
    await expect(service.add('profile-1', 'job-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('add saves when job is published and no deadline passed', async () => {
    bookmarkRepo.findOne.mockResolvedValue(null);
    const future = new Date(Date.now() + 86400000);
    jobRepo.findOne.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.ACTIVE,
      applicationDeadline: future,
    } as Job);
    bookmarkRepo.save.mockResolvedValue({} as JobBookmark);

    await service.add('profile-1', 'job-1');

    expect(bookmarkRepo.save).toHaveBeenCalledWith({
      jobseekerProfileId: 'profile-1',
      jobId: 'job-1',
    });
  });

  it('remove throws NotFound when no row deleted', async () => {
    bookmarkRepo.delete.mockResolvedValue({ affected: 0, raw: [] });
    await expect(service.remove('profile-1', 'job-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('listJobIds returns job id strings', async () => {
    bookmarkRepo.find.mockResolvedValue([
      { jobId: 'a' },
      { jobId: 'b' },
    ] as JobBookmark[]);

    const ids = await service.listJobIds('profile-1');

    expect(ids).toEqual(['a', 'b']);
  });
});
