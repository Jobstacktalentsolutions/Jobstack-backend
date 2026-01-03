import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PaystackService } from '../services/paystack.service';
import { PaymentService } from '../services/payment.service';

@Controller('payment/webhook')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(
    private readonly paystackService: PaystackService,
    private readonly paymentService: PaymentService,
  ) {}

  // Handle Paystack webhook events
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() rawBody: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    try {
      // Convert body to string if it's not already
      const payload = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
      
      // Verify and parse webhook event
      const event = this.paystackService.handleWebhook(payload, signature);
      
      if (!event) {
        this.logger.warn('Invalid webhook signature or payload');
        throw new BadRequestException('Invalid webhook signature');
      }

      // Process the webhook event
      await this.paymentService.processWebhookEvent(event);

      this.logger.log(`Webhook processed successfully: ${event.event}`);
      
      return {
        success: true,
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`, error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Return success to Paystack even if processing fails to avoid retries
      // Log the error for investigation
      return {
        success: true,
        message: 'Webhook received',
      };
    }
  }
}
