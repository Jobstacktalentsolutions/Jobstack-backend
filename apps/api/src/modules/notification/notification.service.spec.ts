import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { getQueueToken } from '@nestjs/bull';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '@app/common/database/entities/Notification.entity';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from '@app/common/database/entities/schema.enum';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';

describe('NotificationService', () => {
  let service: NotificationService;
  let queue: any;
  let repository: any;

  const mockQueue = {
    add: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getQueueToken(NotificationType.EMAIL),
          useValue: mockQueue,
        },
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    queue = module.get(getQueueToken(NotificationType.EMAIL));
    repository = module.get(getRepositoryToken(Notification));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should add a job to the email queue', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'test-template',
        context: { name: 'Test User' },
      };

      await service.sendEmail(emailData);

      expect(queue.add).toHaveBeenCalledWith(
        'send_email',
        {
          recipient: emailData.to,
          subject: emailData.subject,
          templateType: emailData.template,
          context: emailData.context,
        },
        expect.any(Object),
      );
    });
  });

  describe('createAppNotification', () => {
    it('should create and save a new notification for a jobseeker', async () => {
      const userId = 'user-123';
      const userType = UserRole.JOB_SEEKER;
      const data = {
        title: 'New Notification',
        message: 'You have a new message',
      };

      const mockNotification = { id: 'notif-1', ...data };
      repository.create.mockReturnValue(mockNotification);
      repository.save.mockResolvedValue(mockNotification);

      const result = await service.createAppNotification(
        userId,
        userType,
        data,
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: data.title,
          message: data.message,
          jobseekerId: userId,
        }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it('should create and save a new notification for an employer', async () => {
      const userId = 'employer-123';
      const userType = UserRole.EMPLOYER;
      const data = {
        title: 'Employer Notification',
        message: 'Notification for employer',
      };

      const mockNotification = { id: 'notif-2', ...data };
      repository.create.mockReturnValue(mockNotification);
      repository.save.mockResolvedValue(mockNotification);

      const result = await service.createAppNotification(
        userId,
        userType,
        data,
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employerId: userId,
        }),
      );
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications', async () => {
      const userId = 'user-123';
      const userType = UserRole.JOB_SEEKER;

      const result = await service.getUserNotifications(userId, userType);

      expect(repository.createQueryBuilder).toHaveBeenCalled();
      expect(result.notifications).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });
});
