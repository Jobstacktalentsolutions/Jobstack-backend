import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
  Payment,
  Employee,
  EmployerProfile,
  JobApplication,
} from '@app/common/database/entities';
import { SystemConfigModule } from '../system-config/system-config.module';
import { EmployerAuthModule } from 'apps/api/src/modules/auth/submodules/employer/employer-auth.module';

// Services
import { PaymentService } from './services/payment.service';
import { PaystackService } from './services/paystack.service';
import { EmployeeActivationCommissionService } from './services/commission.service';

// Controllers
import { PaymentController } from './controllers/payment.controller';
import { PaymentWebhookController } from './controllers/payment-webhook.controller';
import { PaymentAdminController } from './controllers/payment-admin.controller';
import { EmployeeActivationPaymentController } from './controllers/employee-activation-payment.controller';
import { AdminAuthModule } from 'apps/api/src/modules/auth/submodules/admin/admin-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Employee,
      EmployerProfile,
      JobApplication,
    ]),
    ConfigModule,
    EventEmitterModule.forRoot(),
    SystemConfigModule,
    EmployerAuthModule,
    AdminAuthModule,
  ],
  providers: [
    PaymentService,
    PaystackService,
    EmployeeActivationCommissionService,
  ],
  controllers: [
    PaymentController,
    PaymentWebhookController,
    PaymentAdminController,
    EmployeeActivationPaymentController,
  ],
  exports: [
    PaymentService,
    PaystackService,
    EmployeeActivationCommissionService,
  ],
})
export class PaymentModule {}
