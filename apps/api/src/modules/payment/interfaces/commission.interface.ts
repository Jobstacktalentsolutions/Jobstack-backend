export interface CommissionBreakdown {
  baseAmount: number; // Salary or contract fee
  annualAmount: number; // baseAmount * 12 for permanent, or as-is for contract
  percentage: number; // e.g., 0.15 for 15%
  floor: number; // Minimum commission
  ceiling: number; // Maximum commission
  calculatedCommission: number; // annualAmount * percentage
  appliedCommission: number; // After floor/ceiling bounds
  vatRate: number; // e.g., 0.075 for 7.5%
  vatAmount: number; // appliedCommission * vatRate
  totalAmount: number; // appliedCommission + vatAmount
  breakdown: string; // Human-readable summary
}
