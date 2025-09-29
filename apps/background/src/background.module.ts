import { Module } from '@nestjs/common';
import { BackgroundController } from './background.controller';
import { BackgroundService } from './background.service';

@Module({
  imports: [],
  controllers: [BackgroundController],
  providers: [BackgroundService],
})
export class BackgroundModule {}
