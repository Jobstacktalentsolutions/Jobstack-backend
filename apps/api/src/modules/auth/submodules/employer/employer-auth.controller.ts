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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  GoogleAuthDto,
} from './dto/employer-auth.dto';
import { ReqDeviceInfo, type RequestDeviceInfo } from 'libs/common/src/shared';
import { EmployerJwtGuard } from 'apps/api/src/guards';

@ApiTags('Auth (employer)')
@Controller('auth/employer')
export class EmployerAuthController {
  constructor(private employerAuthService: EmployerAuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register employer account' })
  @ApiBody({ type: EmployerRegistrationDto })
  async register(
    @Body() registrationData: EmployerRegistrationDto,
    @ReqDeviceInfo() deviceInfo: RequestDeviceInfo,
  ) {
    const result = await this.employerAuthService.register(
      registrationData,
      deviceInfo,
    );
    console.log('result', result);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Employer login' })
  @ApiBody({ type: LoginDto })
  async login(
    @Body() loginData: LoginDto,
    @ReqDeviceInfo() deviceInfo: RequestDeviceInfo,
  ) {
    return await this.employerAuthService.login(loginData, deviceInfo);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Employer Google sign-in/sign-up' })
  @ApiBody({ type: GoogleAuthDto })
  async googleAuth(
    @Body() googleAuthData: GoogleAuthDto,
    @ReqDeviceInfo() deviceInfo: RequestDeviceInfo,
  ) {
    return await this.employerAuthService.googleAuth(
      googleAuthData,
      deviceInfo,
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  async logout(@Req() req: any) {
    const { sessionId, jti, refreshTokenId } = req.user;
    await this.employerAuthService.logout(sessionId, jti, refreshTokenId);
  }

  @Post('send-verification-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email verification code' })
  @ApiBody({ type: EmailVerificationRequestDto })
  async sendVerificationEmail(
    @Body() requestData: EmailVerificationRequestDto,
  ) {
    return await this.employerAuthService.sendVerificationEmail(
      requestData.email,
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm email with code' })
  @ApiBody({ type: EmailVerificationConfirmDto })
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
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiBody({ type: PasswordResetRequestDto })
  async sendPasswordResetCode(@Body() requestData: PasswordResetRequestDto) {
    return await this.employerAuthService.sendPasswordResetCode(requestData);
  }

  @Post('confirm-password-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm reset code from email' })
  @ApiBody({ type: PasswordResetConfirmCodeDto })
  async confirmPasswordResetCode(
    @Body() confirmData: PasswordResetConfirmCodeDto,
  ) {
    return await this.employerAuthService.confirmPasswordResetCode(confirmData);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set new password with reset token' })
  @ApiBody({ type: PasswordResetDto })
  async resetPassword(@Body() resetData: PasswordResetDto) {
    return await this.employerAuthService.resetPassword(resetData);
  }
}
