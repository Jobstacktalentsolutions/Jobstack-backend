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
import { JobSeekerAuthService } from './jobseeker-auth.service';
import {
  JobSeekerRegistrationDto,
  LoginDto,
  RefreshTokenDto,
  EmailVerificationRequestDto,
  EmailVerificationConfirmDto,
  PasswordResetRequestDto,
  PasswordResetConfirmCodeDto,
  PasswordResetDto,
} from './dto/jobseeker-auth.dto';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';

@Controller('auth/jobseeker')
export class JobSeekerAuthController {
  constructor(private jobseekerAuthService: JobSeekerAuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registrationData: JobSeekerRegistrationDto,
    @Req() req: Request,
  ) {
    const deviceInfo = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'],
      language: req.headers['accept-language'],
    };
    return await this.jobseekerAuthService.register(
      registrationData,
      deviceInfo,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginData: LoginDto, @Req() req: Request) {
    const deviceInfo = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'],
      language: req.headers['accept-language'],
    };
    return await this.jobseekerAuthService.login(loginData, deviceInfo);
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
    return await this.jobseekerAuthService.refreshToken(
      refreshTokenDto.refreshToken,
      deviceInfo,
    );
  }

  @UseGuards(JobSeekerJwtGuard)
  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: any) {
    const { sessionId, jti, refreshTokenId } = req.user;
    await this.jobseekerAuthService.logout(sessionId, jti, refreshTokenId);
  }

  @Post('send-verification-email')
  @HttpCode(HttpStatus.OK)
  async sendVerificationEmail(
    @Body() requestData: EmailVerificationRequestDto,
  ) {
    return await this.jobseekerAuthService.sendVerificationEmail(
      requestData.email,
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() confirmData: EmailVerificationConfirmDto) {
    return await this.jobseekerAuthService.verifyEmail(
      confirmData.email,
      confirmData.code,
    );
  }

  @Post('send-password-reset-code')
  @HttpCode(HttpStatus.OK)
  async sendPasswordResetCode(@Body() requestData: PasswordResetRequestDto) {
    return await this.jobseekerAuthService.sendPasswordResetCode(requestData);
  }

  @Post('confirm-password-reset-code')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordResetCode(
    @Body() confirmData: PasswordResetConfirmCodeDto,
  ) {
    return await this.jobseekerAuthService.confirmPasswordResetCode(
      confirmData,
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetData: PasswordResetDto) {
    return await this.jobseekerAuthService.resetPassword(resetData);
  }
}
