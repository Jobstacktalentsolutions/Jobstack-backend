# System Configuration Module

## Purpose

The System Configuration module provides a centralized way to manage admin-configurable system settings. This module allows administrators to control various system behaviors and parameters without requiring code changes.

## Architecture

The module consists of:

- **SystemConfigService**: Core service for managing configuration values
- **SystemConfigController**: Admin endpoints for viewing and updating configurations
- **SystemConfigKey Enum**: Type-safe enum of all available configuration keys
- **SystemConfig Entity**: Database entity for storing configuration values

## Configuration Keys

All configuration keys are defined in `system-config-keys.enum.ts` to ensure type safety and prevent typos. When adding new configuration keys:

1. Add the key to the `SystemConfigKey` enum
2. Add default value handling in `SystemConfigService.getConfig()` if needed
3. Add initialization in `SystemConfigService.initializeDefaults()` if needed

## Usage

### In Services

```typescript
import { SystemConfigService } from '../system-config/services/system-config.service';
import { SystemConfigKey } from '../system-config/system-config-keys.enum';

// Get a configuration value
const percentage = await this.systemConfigService.getConfig(
  SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE
);
```

### Admin API

- `GET /admin/system-config` - Get all configurations
- `PUT /admin/system-config` - Update a configuration

## Current Configuration Keys

- `EMPLOYEE_ACTIVATION_PERCENTAGE`: Percentage of salary/contract fee required as upfront payment for employee activation (default: 10)

## Extending

To add new configuration keys:

1. Add to `SystemConfigKey` enum
2. Update `getConfig()` method to handle defaults if needed
3. Update `initializeDefaults()` to set initial values
4. Document the new key in this README
