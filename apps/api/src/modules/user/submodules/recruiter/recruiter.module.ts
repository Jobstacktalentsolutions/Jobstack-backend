import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruiterProfile } from '@app/common/database/entities/RecruiterProfile.entity';
import { RecruiterAuth } from '@app/common/database/entities/RecruiterAuth.entity';
import { RecruiterController } from './recruiter.controller';
import { RecruiterService } from './recruiter.service';
import { StorageService } from '@app/common/storage/storage.service';
import { RecruiterJwtGuard } from 'apps/api/src/guards';

@Module({
  imports: [TypeOrmModule.forFeature([RecruiterProfile, RecruiterAuth])],
  controllers: [RecruiterController],
  providers: [RecruiterService, StorageService, RecruiterJwtGuard],
  exports: [RecruiterService],
})
export class RecruiterModule {}
