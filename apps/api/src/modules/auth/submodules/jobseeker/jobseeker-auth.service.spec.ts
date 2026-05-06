import { Test, TestingModule } from '@nestjs/testing';
import { JobSeekerAuthService } from './jobseeker-auth.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@app/common/redis/redis.service';
import { NotificationService } from '../../../notification/notification.service';
import { DataSource } from 'typeorm';
import { SkillsService } from '../../../skills/skills.service';
import { GoogleIdentityService } from '../../google/google-identity.service';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { JobseekerSession } from '@app/common/database/entities/JobseekerSession.entity';
import { EmployerAuth } from '@app/common/database/entities/EmployerAuth.entity';
import * as bcrypt from 'bcryptjs';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('JobSeekerAuthService', () => {
  let service: JobSeekerAuthService;
  let authRepo: any;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('token'),
    verifyAsync: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
  };

  const mockNotificationService = {
    sendEmail: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest.fn(),
        save: jest.fn(),
        getRepository: jest.fn().mockReturnValue(mockRepository),
      },
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobSeekerAuthService,
        {
          provide: getRepositoryToken(JobseekerAuth),
          useValue: mockRepository,
        },
        { provide: getRepositoryToken(EmployerAuth), useValue: mockRepository },
        {
          provide: getRepositoryToken(JobSeekerProfile),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(JobseekerSession),
          useValue: mockRepository,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: DataSource, useValue: mockDataSource },
        { provide: SkillsService, useValue: { findByNames: jest.fn() } },
        {
          provide: GoogleIdentityService,
          useValue: { verifyIdToken: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<JobSeekerAuthService>(JobSeekerAuthService);
    authRepo = module.get(getRepositoryToken(JobseekerAuth));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should throw UnauthorizedException if user not found', async () => {
      authRepo.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const mockAuth = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        emailVerified: true,
      };
      authRepo.findOne.mockResolvedValue(mockAuth);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if email not verified', async () => {
      const mockAuth = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        emailVerified: false,
      };
      authRepo.findOne.mockResolvedValue(mockAuth);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '1234567890',
    };

    it('should throw ConflictException if email already exists', async () => {
      authRepo.findOne.mockResolvedValue({ id: '1' });
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
