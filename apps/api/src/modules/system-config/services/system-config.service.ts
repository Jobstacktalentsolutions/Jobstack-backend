import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from '@app/common/database/entities';
import { SystemConfigKey } from '../system-config-keys.enum';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepo: Repository<SystemConfig>,
  ) {}

  // Get configuration value by key
  async getConfig(key: SystemConfigKey | string): Promise<any> {
    const config = await this.systemConfigRepo.findOne({ where: { key } });
    if (!config) {
      // Return default values for known keys
      if (key === SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE) {
        return 10; // Default 10%
      }
      throw new NotFoundException(`Configuration key '${key}' not found`);
    }

    try {
      return JSON.parse(config.value);
    } catch {
      return config.value;
    }
  }

  // Update configuration (admin only)
  async updateConfig(
    key: SystemConfigKey | string,
    value: any,
    updatedBy: string,
    description?: string,
  ): Promise<SystemConfig> {
    let config = await this.systemConfigRepo.findOne({ where: { key } });

    if (!config) {
      config = this.systemConfigRepo.create({
        key,
        value: JSON.stringify(value),
        description,
        updatedBy,
      });
    } else {
      config.value = JSON.stringify(value);
      config.updatedBy = updatedBy;
      if (description !== undefined) {
        config.description = description;
      }
    }

    return this.systemConfigRepo.save(config);
  }

  // Get all configurations
  async getAllConfigs(): Promise<SystemConfig[]> {
    return this.systemConfigRepo.find({
      relations: ['updatedByAdmin'],
      order: { key: 'ASC' },
    });
  }

  // Get employee activation percentage
  async getEmployeeActivationPercentage(): Promise<number> {
    const percentage = await this.getConfig(
      SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE,
    );

    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      throw new BadRequestException(
        'Invalid employee activation percentage configuration',
      );
    }

    return percentage;
  }

  // Initialize default configurations
  async initializeDefaults(): Promise<void> {
    const defaultConfigs = [
      {
        key: SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE,
        value: 10,
        description:
          'Percentage of salary/contract fee required as upfront payment for employee activation',
      },
    ];

    for (const config of defaultConfigs) {
      const existing = await this.systemConfigRepo.findOne({
        where: { key: config.key },
      });
      if (!existing) {
        await this.systemConfigRepo.save(
          this.systemConfigRepo.create({
            key: config.key,
            value: JSON.stringify(config.value),
            description: config.description,
          }),
        );
      }
    }
  }
}
