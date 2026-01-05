import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { SystemConfigService } from '../../system-config/services/system-config.service';
import { SystemConfigKey } from '../../system-config/system-config-keys.enum';
import { PaymentQueryDto, UpdatePaymentPercentageDto } from '../dto';
import { AdminJwtGuard } from '../../../guards/admin-jwt.guard';
import { RequireAdminRole } from '../../../guards/require-admin-role.decorator';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
import { CurrentUser } from '@app/common/shared/decorators/current-user.decorator';

@Controller('admin/payment')
@UseGuards(AdminJwtGuard)
@RequireAdminRole([
  AdminRole.FINANCE_BILLING_MANAGER.role,
  AdminRole.SUPER_ADMIN.role,
])
export class PaymentAdminController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  // Get system payment configuration
  @Get('config')
  async getPaymentConfig() {
    const configs = await this.systemConfigService.getAllConfigs();

    return {
      success: true,
      data: configs,
    };
  }

  // Update payment percentage configuration
  @Put('config/percentage')
  async updatePaymentPercentage(
    @CurrentUser('id') adminId: string,
    @Body() dto: UpdatePaymentPercentageDto,
  ) {
    const config = await this.systemConfigService.updateConfig(
      SystemConfigKey.EMPLOYEE_ACTIVATION_PERCENTAGE,
      dto.percentage,
      adminId,
      dto.description ||
        'Percentage of salary/contract fee required as upfront payment for employee activation',
    );

    return {
      success: true,
      message: 'Payment percentage updated successfully',
      data: config,
    };
  }

  // Get all payments (admin view)
  @Get()
  async getAllPayments(@Query() query: PaymentQueryDto) {
    const result = await this.paymentService.getPaymentHistory(query);

    return {
      success: true,
      data: result,
    };
  }

  // Get payment details by ID (admin view)
  @Get(':paymentId')
  async getPaymentDetails(@Param('paymentId') paymentId: string) {
    const payment = await this.paymentService.getPaymentById(paymentId);

    return {
      success: true,
      data: payment,
    };
  }

  // Get payment statistics
  @Get('stats/overview')
  async getPaymentStats() {
    // This would typically include aggregated payment data
    // For now, return basic structure
    return {
      success: true,
      data: {
        totalPayments: 0,
        successfulPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        totalAmount: 0,
        // Add more statistics as needed
      },
    };
  }
}
