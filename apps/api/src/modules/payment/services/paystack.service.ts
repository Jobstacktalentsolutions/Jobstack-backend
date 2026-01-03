import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ENV } from '../../config/env.config';

// Paystack types
interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: any;
    customer: any;
    plan: any;
    split: any;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
  };
}

interface PaystackWebhookEvent {
  event: string;
  data: any;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>(ENV.PAYSTACK_SECRET_KEY);
    this.publicKey = this.configService.get<string>(ENV.PAYSTACK_PUBLIC_KEY);
    this.webhookSecret = this.configService.get<string>(ENV.PAYSTACK_WEBHOOK_SECRET);
  }

  // Initialize transaction
  async initializeTransaction(params: {
    email: string;
    amount: number; // Amount in kobo (NGN * 100)
    reference: string;
    currency?: string;
    callback_url?: string;
    metadata?: any;
  }): Promise<PaystackInitializeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: params.email,
          amount: params.amount,
          reference: params.reference,
          currency: params.currency || 'NGN',
          callback_url: params.callback_url,
          metadata: params.metadata,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        this.logger.error(`Paystack initialization failed: ${data.message}`, data);
        throw new BadRequestException(`Payment initialization failed: ${data.message}`);
      }

      this.logger.log(`Payment initialized: ${params.reference}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to initialize payment: ${error.message}`, error);
      throw error;
    }
  }

  // Verify transaction
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        this.logger.error(`Paystack verification failed: ${data.message}`, data);
        throw new BadRequestException(`Payment verification failed: ${data.message}`);
      }

      this.logger.log(`Payment verified: ${reference} - Status: ${data.data.status}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to verify payment: ${error.message}`, error);
      throw error;
    }
  }

  // Handle webhook events
  handleWebhook(payload: string, signature: string): PaystackWebhookEvent | null {
    try {
      // Verify webhook signature
      const hash = crypto
        .createHmac('sha512', this.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      if (hash !== signature) {
        this.logger.warn('Invalid webhook signature');
        return null;
      }

      const event: PaystackWebhookEvent = JSON.parse(payload);
      this.logger.log(`Webhook received: ${event.event}`);
      
      return event;
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${error.message}`, error);
      return null;
    }
  }

  // Get public key for frontend
  getPublicKey(): string {
    return this.publicKey;
  }

  // Generate unique reference
  generateReference(prefix = 'PAY'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  // Convert amount to kobo (Paystack uses kobo for NGN)
  convertToKobo(amount: number): number {
    return Math.round(amount * 100);
  }

  // Convert amount from kobo
  convertFromKobo(amount: number): number {
    return amount / 100;
  }
}
