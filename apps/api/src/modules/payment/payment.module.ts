import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
  Payment,
  Employee,
  EmployerProfile,
} from '@app/common/database/entities';
import { SystemConfigModule } from '../system-config/system-config.module';
import { EmployerAuthModule } from 'apps/api/src/modules/auth/submodules/employer/employer-auth.module';

// Services
import { PaymentService } from './services/payment.service';
import { PaystackService } from './services/paystack.service';

// Controllers
import { PaymentController } from './controllers/payment.controller';
import { PaymentWebhookController } from './controllers/payment-webhook.controller';
import { PaymentAdminController } from './controllers/payment-admin.controller';
import { AdminAuthModule } from 'apps/api/src/modules/auth/submodules/admin/admin-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Employee, EmployerProfile]),
    ConfigModule,
    SystemConfigModule,
    EmployerAuthModule,
    AdminAuthModule,
  ],
  providers: [PaymentService, PaystackService],
  controllers: [
    PaymentController,
    PaymentWebhookController,
    PaymentAdminController,
  ],
  exports: [PaymentService, PaystackService],
})
export class PaymentModule {}
