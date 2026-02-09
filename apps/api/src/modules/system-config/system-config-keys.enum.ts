/**
 * System Configuration Keys Enum
 *
 * Centralized enum for all system configuration keys.
 * This ensures type safety and prevents typos when referencing config keys.
 */
export enum SystemConfigKey {
  // Employee Activation Payment Configuration
  EMPLOYEE_ACTIVATION_PERCENTAGE = 'EMPLOYEE_ACTIVATION_PERCENTAGE',
  EMPLOYEE_ACTIVATION_PERCENTAGE_FLOOR = 'EMPLOYEE_ACTIVATION_PERCENTAGE_FLOOR',
  EMPLOYEE_ACTIVATION_PERCENTAGE_CEILING = 'EMPLOYEE_ACTIVATION_PERCENTAGE_CEILING',
  EMPLOYEE_ACTIVATION_PERCENTAGE_VAT_RATE = 'EMPLOYEE_ACTIVATION_PERCENTAGE_VAT_RATE',

  // Add more configuration keys here as needed
  // Example:
  // MAX_FILE_UPLOAD_SIZE = 'MAX_FILE_UPLOAD_SIZE',
  // EMAIL_NOTIFICATION_ENABLED = 'EMAIL_NOTIFICATION_ENABLED',
}
