import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfig } from '@app/common/database/entities';
import { SystemConfigService } from './services/system-config.service';
import { SystemConfigController } from './controllers/system-config.controller';
import { AdminAuthModule } from 'apps/api/src/modules/auth/submodules/admin/admin-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfig]), AdminAuthModule],
  providers: [SystemConfigService],
  controllers: [SystemConfigController],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
