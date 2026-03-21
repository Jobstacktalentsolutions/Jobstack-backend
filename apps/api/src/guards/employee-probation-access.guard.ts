import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminJwtGuard } from './admin-jwt.guard';
import { EmployerJwtGuard } from './employer-jwt.guard';
import { JobSeekerJwtGuard } from './jobseeker-jwt.guard';

/**
 * Allows Admin, Employer, or JobSeeker access for probation endpoints.
 */
@Injectable()
export class EmployeeProbationAccessGuard implements CanActivate {
  constructor(
    private readonly adminJwtGuard: AdminJwtGuard,
    private readonly employerJwtGuard: EmployerJwtGuard,
    private readonly jobSeekerJwtGuard: JobSeekerJwtGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try role-specific guards as OR (any accepted role grants access).
    const guards = [this.adminJwtGuard, this.employerJwtGuard, this.jobSeekerJwtGuard];

    let lastError: unknown;
    for (const guard of guards) {
      try {
        const ok = await guard.canActivate(context);
        if (ok) return true;
      } catch (error) {
        lastError = error;
      }
    }

    throw new UnauthorizedException(
      lastError instanceof Error ? lastError.message : 'Authentication failed',
    );
  }
}

