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
      throw new NotFoundException(`Configuration key '${key}' not found`);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(config.value);
    } catch {
      parsed = config.value;
    }

    // For numeric config keys, validate the value is actually a number
    const numericKeys = [
      SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE,
      SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_FLOOR,
      SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_CEILING,
      SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_VAT_RATE,
    ] as string[];

    if (numericKeys.includes(key as string)) {
      const n = Number(parsed);
      if (isNaN(n)) {
        throw new BadRequestException(
          `Configuration key '${key}' has an invalid non-numeric value: "${config.value}". Please set a valid number via the admin config endpoint.`,
        );
      }
      return n;
    }

    return parsed;
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
        value: 0.15,
        description:
          'Base percentage for employee activation/agency commission fee (15% = 0.15)',
      },
      {
        key: SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_FLOOR,
        value: 1500000,
        description:
          'Minimum employee activation fee amount in kobo (₦15,000 = 1,500,000 kobo)',
      },
      {
        key: SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_CEILING,
        value: 100000000,
        description:
          'Maximum employee activation fee amount in kobo (₦1,000,000 = 100,000,000 kobo)',
      },
      {
        key: SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_VAT_RATE,
        value: 0.075,
        description:
          'VAT rate applied to employee activation fee (7.5% = 0.075)',
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
