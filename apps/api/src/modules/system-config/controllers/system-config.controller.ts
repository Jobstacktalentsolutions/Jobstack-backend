import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from '../services/system-config.service';
import { UpdateSystemConfigDto } from '../dto';
import { AdminJwtGuard } from '../../../guards/admin-jwt.guard';
import { RequireAdminRole } from '../../../guards/require-admin-role.decorator';
import { CurrentUser } from '@app/common/shared/decorators/current-user.decorator';
import { AdminRole } from '@app/common/shared/enums/roles.enum';

@Controller('admin/system-config')
@UseGuards(AdminJwtGuard)
@RequireAdminRole(AdminRole.SUPER_ADMIN.role)
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  // Get all system configurations
  @Get()
  async getAllConfigs() {
    const configs = await this.systemConfigService.getAllConfigs();

    return {
      success: true,
      data: configs,
    };
  }

  // Update system configuration
  @Put()
  async updateSystemConfig(
    @CurrentUser('id') adminId: string,
    @Body() dto: UpdateSystemConfigDto,
  ) {
    const config = await this.systemConfigService.updateConfig(
      dto.key,
      dto.value,
      adminId,
      dto.description,
    );

    return {
      success: true,
      message: 'System configuration updated successfully',
      data: config,
    };
  }
}
