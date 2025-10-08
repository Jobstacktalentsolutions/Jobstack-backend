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
import type { Request } from 'express';
import { AdminAuthService } from './admin-auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  EmailVerificationRequestDto,
  EmailVerificationConfirmDto,
  PasswordResetRequestDto,
  PasswordResetConfirmCodeDto,
  PasswordResetDto,
} from './dto/admin-auth.dto';
import { AdminJwtGuard } from 'apps/api/src/guards';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginData: LoginDto, @Req() req: Request) {
    const deviceInfo = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'],
      language: req.headers['accept-language'],
    };
    return await this.adminAuthService.login(loginData, deviceInfo);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    const deviceInfo = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'],
      language: req.headers['accept-language'],
    };
    return await this.adminAuthService.refreshToken(
      refreshTokenDto.refreshToken,
      deviceInfo,
    );
  }

  @UseGuards(AdminJwtGuard)
  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: any) {
    const { sessionId, jti, refreshTokenId } = req.user;
    await this.adminAuthService.logout(sessionId, jti, refreshTokenId);
  }

  @Post('send-verification-email')
  @HttpCode(HttpStatus.OK)
  async sendVerificationEmail(
    @Body() requestData: EmailVerificationRequestDto,
  ) {
    return await this.adminAuthService.sendVerificationEmail(requestData.email);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() confirmData: EmailVerificationConfirmDto) {
    return await this.adminAuthService.verifyEmail(
      confirmData.email,
      confirmData.code,
    );
  }

  @Post('send-password-reset-code')
  @HttpCode(HttpStatus.OK)
  async sendPasswordResetCode(@Body() requestData: PasswordResetRequestDto) {
    return await this.adminAuthService.sendPasswordResetCode(requestData);
  }

  @Post('confirm-password-reset-code')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordResetCode(
    @Body() confirmData: PasswordResetConfirmCodeDto,
  ) {
    return await this.adminAuthService.confirmPasswordResetCode(confirmData);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetData: PasswordResetDto) {
    return await this.adminAuthService.resetPassword(resetData);
  }
}
