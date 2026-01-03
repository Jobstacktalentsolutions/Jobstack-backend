import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { 
  InitiatePaymentDto, 
  PaymentQueryDto, 
  VerifyPaymentDto 
} from '../dto';
import { EmployerJwtGuard } from '../../../guards/employer-jwt.guard';
import { CurrentUser } from '@app/common/shared/decorators/current-user.decorator';

@Controller('payment')
@UseGuards(EmployerJwtGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Initiate payment for employee activation
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  async initiatePayment(
    @CurrentUser('profileId') employerId: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    
    const result = await this.paymentService.initiatePayment({
      employeeId: dto.employeeId,
      employerId,
      callbackUrl: dto.callbackUrl,
    });

    return {
      success: true,
      message: 'Payment initiated successfully',
      data: result,
    };
  }

  // Get payment details by ID
  @Get(':paymentId')
  async getPayment(
    @CurrentUser('profileId') employerId: string,
    @Param('paymentId') paymentId: string,
  ) {
    
    const payment = await this.paymentService.getPaymentById(paymentId, employerId);

    return {
      success: true,
      data: payment,
    };
  }

  // Get payment for specific employee
  @Get('employee/:employeeId')
  async getEmployeePayment(
    @CurrentUser('profileId') employerId: string,
    @Param('employeeId') employeeId: string,
  ) {
    
    const paymentStatus = await this.paymentService.checkPaymentStatus(employeeId);

    let payment = null;
    if (paymentStatus.paymentId) {
      payment = await this.paymentService.getPaymentById(paymentStatus.paymentId, employerId);
    }

    return {
      success: true,
      data: {
        paymentStatus,
        payment,
      },
    };
  }

  // Verify payment manually
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    const result = await this.paymentService.verifyPayment(dto.reference);

    return {
      success: true,
      message: 'Payment verification completed',
      data: result,
    };
  }

  // Get payment history for employer
  @Get()
  async getPaymentHistory(
    @CurrentUser('profileId') employerId: string,
    @Query() query: PaymentQueryDto,
  ) {
    
    const result = await this.paymentService.getPaymentHistory({
      ...query,
      employerId,
    });

    return {
      success: true,
      data: result,
    };
  }
}
