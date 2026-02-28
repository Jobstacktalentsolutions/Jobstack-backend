import { SystemConfigKey } from 'apps/api/src/modules/system-config/system-config-keys.enum';

/**
 * Default system configuration values for JobStack platform.
 *
 * Commission calculation flow (all monetary values are in Naira):
 *   annualAmount = salary × 12  (or contract fee as-is)
 *   calculatedCommission = annualAmount × PERCENTAGE
 *   appliedCommission = clamp(calculatedCommission, FLOOR, CEILING)
 *   vatAmount = appliedCommission × VAT_RATE
 *   totalDue = appliedCommission + vatAmount
 */
export const SYSTEM_CONFIG_DATA: Array<{
  key: SystemConfigKey;
  value: number;
  description: string;
}> = [
  {
    key: SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE,
    value: 0.15,
    description:
      'Agency commission rate applied to annual salary/contract fee (15% = 0.15)',
  },
  {
    key: SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_FLOOR,
    value: 15000,
    description:
      'Minimum commission amount in Naira before VAT (₦15,000). Ensures viability for low-salary placements.',
  },
  {
    key: SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_CEILING,
    value: 1000000,
    description:
      'Maximum commission amount in Naira before VAT (₦1,000,000). Caps fees for very high-salary placements.',
  },
  {
    key: SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_VAT_RATE,
    value: 0.075,
    description:
      'Nigerian VAT rate applied on top of the commission (7.5% = 0.075)',
  },
];
