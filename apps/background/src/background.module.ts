import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackgroundController } from './background.controller';
import { BackgroundService } from './background.service';
import { LoggerModule } from '@app/common';

@Module({
  imports: [ConfigModule.forRoot(), LoggerModule],
  controllers: [BackgroundController],
  providers: [BackgroundService],
})
export class BackgroundModule {}
