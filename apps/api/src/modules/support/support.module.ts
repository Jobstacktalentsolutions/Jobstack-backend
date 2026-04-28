import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([AdminAuth]), NotificationModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
