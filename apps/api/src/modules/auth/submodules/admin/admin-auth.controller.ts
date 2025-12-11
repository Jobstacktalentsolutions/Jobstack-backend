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
import { ReqDeviceInfo, type RequestDeviceInfo } from 'libs/common/src/shared';
import { AdminAuthService } from './admin-auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  PasswordResetRequestDto,
  PasswordResetConfirmCodeDto,
  PasswordResetDto,
  AdminDefaultPasswordChangeDto,
  AdminDefaultPasswordChangeRequestDto,
} from './dto/admin-auth.dto';
import { AdminJwtGuard } from 'apps/api/src/guards';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginData: LoginDto,
    @ReqDeviceInfo() deviceInfo: RequestDeviceInfo,
  ) {
    return await this.adminAuthService.login(loginData, deviceInfo);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @ReqDeviceInfo() deviceInfo: RequestDeviceInfo,
  ) {
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

  @Post('request-default-password-change')
  @HttpCode(HttpStatus.OK)
  async requestDefaultPasswordChange(
    @Body() requestData: AdminDefaultPasswordChangeRequestDto,
  ) {
    return await this.adminAuthService.requestDefaultPasswordChange(
      requestData,
    );
  }

  @Post('complete-default-password-change')
  @HttpCode(HttpStatus.OK)
  async completeDefaultPasswordChange(
    @Body() changeData: AdminDefaultPasswordChangeDto,
  ) {
    return await this.adminAuthService.completeDefaultPasswordChange(
      changeData,
    );
  }
}
