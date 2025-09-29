import { Test, TestingModule } from '@nestjs/testing';
import { BackgroundController } from './background.controller';
import { BackgroundService } from './background.service';

describe('BackgroundController', () => {
  let backgroundController: BackgroundController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BackgroundController],
      providers: [BackgroundService],
    }).compile();

    backgroundController = app.get<BackgroundController>(BackgroundController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(backgroundController.getHello()).toBe('Hello World!');
    });
  });
});
