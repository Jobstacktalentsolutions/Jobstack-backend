import { PaymentStatus, PaymentType } from '@app/common/database/entities/schema.enum';

export interface PaymentCalculationResult {
  amount: number;
  percentage: number;
  baseAmount: number;
  currency: string;
  paymentType: PaymentType;
}

export interface InitiatePaymentParams {
  employeeId: string;
  employerId: string;
  callbackUrl?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  paymentId: string;
  paystackReference: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: Date;
}

export interface PaymentHistoryQuery {
  employerId?: string;
  employeeId?: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  page?: number;
  limit?: number;
}

export interface PaymentHistoryResult {
  items: any[];
  total: number;
  page: number;
  limit: number;
}

export class PaymentRequiredException extends Error {
  constructor(message: string, public readonly paymentId?: string) {
    super(message);
    this.name = 'PaymentRequiredException';
  }
}
