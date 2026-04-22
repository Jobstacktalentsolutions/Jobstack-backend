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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { EmployerJwtGuard } from 'apps/api/src/guards';
import { EmployeeActivationInitiateDto } from '../dto';

@ApiTags('Payment')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Initiate employee activation payment' })
  @ApiBody({ type: EmployeeActivationInitiateDto, required: false })
  async initiatePayment(
    @Param('employeeId') employeeId: string,
    @Req() req: any,
    @Body() body?: EmployeeActivationInitiateDto,
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
   * Get commission breakdown for an employee activation payment
   * GET /payment/employee-activation/breakdown/:employeeId
   */
  @Get('breakdown/:employeeId')
  async getBreakdown(@Param('employeeId') employeeId: string, @Req() req: any) {
    const employerId = req.user.profileId;

    const breakdown = await this.paymentService.getActivationBreakdown(
      employeeId,
      employerId,
    );

    return {
      success: true,
      data: breakdown,
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
