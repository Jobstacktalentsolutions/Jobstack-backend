import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { 
  Payment, 
  SystemConfig, 
  Employee, 
  EmployerProfile 
} from '@app/common/database/entities';

// Services
import { PaymentService } from './services/payment.service';
import { PaystackService } from './services/paystack.service';
import { SystemConfigService } from './services/system-config.service';

// Controllers
import { PaymentController } from './controllers/payment.controller';
import { PaymentWebhookController } from './controllers/payment-webhook.controller';
import { PaymentAdminController } from './controllers/payment-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      SystemConfig,
      Employee,
      EmployerProfile,
    ]),
    ConfigModule,
  ],
  providers: [
    PaymentService,
    PaystackService,
    SystemConfigService,
  ],
  controllers: [
    PaymentController,
    PaymentWebhookController,
    PaymentAdminController,
  ],
  exports: [
    PaymentService,
    PaystackService,
    SystemConfigService,
  ],
})
export class PaymentModule {}
