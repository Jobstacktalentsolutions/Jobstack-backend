import { Injectable, Logger } from '@nestjs/common';
import { SystemConfigService } from '../../system-config/services/system-config.service';
import { SystemConfigKey } from '../../system-config/system-config-keys.enum';
import { CommissionBreakdown } from '../interfaces/commission.interface';

@Injectable()
export class EmployeeActivationCommissionService {
  private readonly logger = new Logger(
    EmployeeActivationCommissionService.name,
  );

  constructor(private readonly systemConfigService: SystemConfigService) {}

  /**
   * Calculate commission fee with floor/ceiling/VAT
   * @param salaryOffered - Monthly salary for permanent or total contract fee
   * @param isContract - Whether this is a contract employment (affects annualization)
   * @returns CommissionBreakdown with all calculation details
   */
  async calculateCommissionFee(
    salaryOffered: number,
    isContract: boolean,
  ): Promise<CommissionBreakdown> {
    // Fetch configuration values
    const [percentage, floor, ceiling, vatRate] = await Promise.all([
      this.systemConfigService.getConfig(
        SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE,
      ),
      this.systemConfigService.getConfig(
        SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_FLOOR,
      ),
      this.systemConfigService.getConfig(
        SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_CEILING,
      ),
      this.systemConfigService.getConfig(
        SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE_VAT_RATE,
      ),
    ]);

    const percentageValue = parseFloat(percentage.value);
    const floorValue = parseFloat(floor.value);
    const ceilingValue = parseFloat(ceiling.value);
    const vatRateValue = parseFloat(vatRate.value);

    // Calculate annual amount
    // For permanent employees: multiply monthly by 12
    // For contracts: use as-is (already project/duration-based)
    const annualAmount = isContract ? salaryOffered : salaryOffered * 12;

    // Calculate base commission
    const calculatedCommission = annualAmount * percentageValue;

    // Apply floor and ceiling bounds
    const appliedCommission = Math.max(
      floorValue,
      Math.min(ceilingValue, calculatedCommission),
    );

    // Calculate VAT (7.5%)
    const vatAmount = appliedCommission * vatRateValue;

    // Total amount due
    const totalAmount = appliedCommission + vatAmount;

    // Generate breakdown text
    const breakdown = this.generateBreakdownText({
      baseAmount: salaryOffered,
      annualAmount,
      percentage: percentageValue,
      floor: floorValue,
      ceiling: ceilingValue,
      calculatedCommission,
      appliedCommission,
      vatRate: vatRateValue,
      vatAmount,
      totalAmount,
      breakdown: '',
    });

    this.logger.log(
      `Commission calculated: ₦${totalAmount.toLocaleString()} for ${isContract ? 'contract' : 'permanent'} role (base: ₦${salaryOffered.toLocaleString()})`,
    );

    return {
      baseAmount: salaryOffered,
      annualAmount,
      percentage: percentageValue,
      floor: floorValue,
      ceiling: ceilingValue,
      calculatedCommission,
      appliedCommission,
      vatRate: vatRateValue,
      vatAmount,
      totalAmount,
      breakdown,
    };
  }

  /**
   * Generate human-readable invoice description
   */
  generateInvoiceDescription(
    employeeName: string,
    jobTitle: string,
    totalAmount: number,
  ): string {
    return `Employee Activation Fee - ${employeeName} (${jobTitle}) - ₦${totalAmount.toLocaleString()}`;
  }

  /**
   * Generate detailed breakdown text for display
   */
  private generateBreakdownText(breakdown: CommissionBreakdown): string {
    const lines: string[] = [];

    lines.push(`Base Amount: ₦${breakdown.baseAmount.toLocaleString()}`);
    lines.push(`Annual Amount: ₦${breakdown.annualAmount.toLocaleString()}`);
    lines.push(`Commission Rate: ${(breakdown.percentage * 100).toFixed(1)}%`);
    lines.push(
      `Calculated Commission: ₦${breakdown.calculatedCommission.toLocaleString()}`,
    );

    // Show if floor or ceiling was applied
    if (breakdown.appliedCommission !== breakdown.calculatedCommission) {
      if (breakdown.appliedCommission === breakdown.floor) {
        lines.push(`Applied Floor: ₦${breakdown.floor.toLocaleString()}`);
      } else if (breakdown.appliedCommission === breakdown.ceiling) {
        lines.push(`Applied Ceiling: ₦${breakdown.ceiling.toLocaleString()}`);
      }
    }

    lines.push(`Commission: ₦${breakdown.appliedCommission.toLocaleString()}`);
    lines.push(
      `VAT (${(breakdown.vatRate * 100).toFixed(1)}%): ₦${breakdown.vatAmount.toLocaleString()}`,
    );
    lines.push(`Total Due: ₦${breakdown.totalAmount.toLocaleString()}`);

    return lines.join('\n');
  }
}
