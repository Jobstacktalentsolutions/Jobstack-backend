import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { EmployerAuthService } from './employer-auth.service';
import {
  EmployerRegistrationDto,
  LoginDto,
  RefreshTokenDto,
  EmailVerificationRequestDto,
  EmailVerificationConfirmDto,
  PasswordResetRequestDto,
  PasswordResetConfirmCodeDto,
  PasswordResetDto,
} from './dto/employer-auth.dto';
import { ReqDeviceInfo, type RequestDeviceInfo } from 'libs/common/src/shared';
import { EmployerJwtGuard } from 'apps/api/src/guards';

@Controller('auth/employer')
export class EmployerAuthController {
  constructor(private employerAuthService: EmployerAuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registrationData: EmployerRegistrationDto,
    @ReqDeviceInfo() deviceInfo: RequestDeviceInfo,
  ) {
    return await this.employerAuthService.register(
      registrationData,
      deviceInfo,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginData: LoginDto,
    @ReqDeviceInfo() deviceInfo: RequestDeviceInfo,
  ) {
    return await this.employerAuthService.login(loginData, deviceInfo);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @ReqDeviceInfo() deviceInfo: RequestDeviceInfo,
  ) {
    return await this.employerAuthService.refreshToken(
      refreshTokenDto.refreshToken,
      deviceInfo,
    );
  }

  @UseGuards(EmployerJwtGuard)
  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: any) {
    const { sessionId, jti, refreshTokenId } = req.user;
    await this.employerAuthService.logout(sessionId, jti, refreshTokenId);
  }

  @Post('send-verification-email')
  @HttpCode(HttpStatus.OK)
  async sendVerificationEmail(
    @Body() requestData: EmailVerificationRequestDto,
  ) {
    return await this.employerAuthService.sendVerificationEmail(
      requestData.email,
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() confirmData: EmailVerificationConfirmDto,
    @ReqDeviceInfo() deviceInfo: RequestDeviceInfo,
  ) {
    return await this.employerAuthService.verifyEmail(
      confirmData.email,
      confirmData.code,
      deviceInfo,
    );
  }

  @Post('send-password-reset-code')
  @HttpCode(HttpStatus.OK)
  async sendPasswordResetCode(@Body() requestData: PasswordResetRequestDto) {
    return await this.employerAuthService.sendPasswordResetCode(requestData);
  }

  @Post('confirm-password-reset-code')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordResetCode(
    @Body() confirmData: PasswordResetConfirmCodeDto,
  ) {
    return await this.employerAuthService.confirmPasswordResetCode(confirmData);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetData: PasswordResetDto) {
    return await this.employerAuthService.resetPassword(resetData);
  }
}
