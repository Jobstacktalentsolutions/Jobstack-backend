import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { EmployerJwtGuard } from 'apps/api/src/guards';

@Controller('payment/employee-activation')
@UseGuards(EmployerJwtGuard)
export class EmployeeActivationPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Initiate employee activation payment
   * POST /payment/employee-activation/initiate/:employeeId
   */
  @Post('initiate/:employeeId')
  @HttpCode(HttpStatus.OK)
  async initiatePayment(
    @Param('employeeId') employeeId: string,
    @Req() req: any,
    @Body() body?: { callbackUrl?: string },
  ) {
    const employerId = req.user.profileId;

    const result = await this.paymentService.initiateActivationPayment(
      employeeId,
      employerId,
      body?.callbackUrl,
    );

    return {
      success: true,
      message: 'Payment initiated successfully',
      data: result,
    };
  }

  /**
   * Get activation payment status for an employee
   * GET /payment/employee-activation/status/:employeeId
   */
  @Get('status/:employeeId')
  async getPaymentStatus(
    @Param('employeeId') employeeId: string,
    @Req() req: any,
  ) {
    const employerId = req.user.profileId;

    const status = await this.paymentService.checkPaymentStatus(employeeId);

    return {
      success: true,
      data: {
        ...status,
        employeeId,
      },
    };
  }
}
