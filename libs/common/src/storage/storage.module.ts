import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './storage.service';
import { Document } from '../database/entities';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Document])],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
