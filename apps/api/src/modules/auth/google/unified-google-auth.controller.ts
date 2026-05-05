import { Body, Controller, Post, Logger } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { GoogleAuthDto } from '../dto/auth.dto';
import { EmployerAuthService } from '../submodules/employer/employer-auth.service';
import { JobSeekerAuthService } from '../submodules/jobseeker/jobseeker-auth.service';
import { AuthResult } from '../interfaces/auth.interface';
import { RateLimit } from 'apps/api/src/guards';

@ApiTags('Auth')
@RateLimit({ limit: 10, ttlSeconds: 60 })
@Controller('auth/google')
export class UnifiedGoogleAuthController {
  private readonly logger = new Logger(UnifiedGoogleAuthController.name);

  constructor(
    private readonly employerAuthService: EmployerAuthService,
    private readonly jobSeekerAuthService: JobSeekerAuthService,
  ) {}

  @Post('unified')
  @RateLimit({ limit: 10, ttlSeconds: 60 })
  @ApiOperation({ summary: 'Unified Google sign-in (auto-detects role)' })
  @ApiBody({ type: GoogleAuthDto })
  async unifiedAuth(
    @Body() googleAuthData: GoogleAuthDto,
  ): Promise<AuthResult> {
    this.logger.log('Unified Google auth request received');

    // 1. Try job seeker first (as requested)
    try {
      return await this.jobSeekerAuthService.googleAuth(googleAuthData);
    } catch (error: unknown) {
      const authError = error as { status?: number; message?: string };

      if (
        authError.status === 409 &&
        authError.message?.includes('Employer with this email exists')
      ) {
        // This means it's an employer, let's try employer auth
        this.logger.log('Email exists as employer, switching to employer auth');
        return await this.employerAuthService.googleAuth(googleAuthData);
      }

      // If it's a 404/NotFound (user doesn't exist yet), or any other error,
      // we need to decide whether to create a jobseeker or employer.
      // The requirement says: "checks if the user has a jobseeker account if they don't it checks if they have an employer account"
      // "the account it finds is the one used to sign in"

      // If user DOES NOT exist, googleAuth in JobSeekerAuthService will CREATE a jobseeker.
      // So the logic is:
      // - If account exists as JobSeeker -> Sign in as JobSeeker
      // - If account exists as Employer -> Sign in as Employer (handled by catch above)
      // - If account DOES NOT exist -> JobSeekerAuthService.googleAuth will create a JobSeeker (default)

      throw error;
    }
  }
}
