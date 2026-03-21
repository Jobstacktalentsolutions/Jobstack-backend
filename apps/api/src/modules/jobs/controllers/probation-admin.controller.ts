import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from 'apps/api/src/guards';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee, JobApplication } from '@app/common/database/entities';
import {
  JobApplicationStatus,
  ProbationStatus,
} from '@app/common/database/entities/schema.enum';

/**
 * Admin-only probation monitoring: list all active probation employees.
 */
@ApiTags('Probation (admin)')
@ApiBearerAuth()
@Controller('admin/probation')
export class ProbationAdminController {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  @Get('overview')
  @UseGuards(AdminJwtGuard)
  @ApiOperation({ summary: 'List employees in active probation' })
  async overview(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const currentPage = Math.max(1, page ?? 1);
    const currentLimit = Math.min(100, Math.max(1, limit ?? 20));
    const skip = (currentPage - 1) * currentLimit;

    const now = new Date();

    const [items, total] = await this.employeeRepo
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.job', 'job')
      .leftJoinAndSelect('employee.employer', 'employer')
      .leftJoinAndSelect('employee.jobseekerProfile', 'jobseeker')
      .leftJoin(
        JobApplication,
        'application',
        'application.jobId = employee.jobId AND application.jobseekerProfileId = employee.jobseekerProfileId',
      )
      .where('employee.probationStatus = :probationStatus', {
        probationStatus: ProbationStatus.ACTIVE,
      })
      .andWhere('application.status = :applicationStatus', {
        applicationStatus: JobApplicationStatus.PLACED_PROBATION,
      })
      .orderBy('employee.startDate', 'ASC')
      .skip(skip)
      .take(currentLimit)
      .getManyAndCount();

    const mapDays = (startDate?: Date) => {
      if (!startDate) return { daysRemaining: 90, daysElapsed: 0 };
      const startUtcMidnight = Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
      );
      const nowUtcMidnight = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
      );
      const daysElapsed = Math.max(
        0,
        Math.floor((nowUtcMidnight - startUtcMidnight) / 86400000),
      );
      const daysRemaining = Math.max(0, 90 - daysElapsed);
      return { daysElapsed, daysRemaining };
    };

    return {
      items: items.map((e) => {
        const { daysRemaining } = mapDays(e.startDate);
        return {
          employeeId: e.id,
          candidateName: e.jobseekerProfile
            ? `${e.jobseekerProfile.firstName} ${e.jobseekerProfile.lastName}`.trim()
            : null,
          employerName: e.employer
            ? `${e.employer.firstName} ${e.employer.lastName}`.trim()
            : null,
          jobTitle: e.job?.title ?? null,
          startDate: e.startDate ?? null,
          daysRemaining,
          pulse30SentAt: e.pulse30SentAt ?? null,
          pulse60SentAt: e.pulse60SentAt ?? null,
          probationStatus: e.probationStatus ?? null,
          // Keep explicit booleans for easy UI rendering.
          day30EmailSent: !!e.pulse30SentAt,
          day60EmailSent: !!e.pulse60SentAt,
        };
      }),
      total,
      page: currentPage,
      limit: currentLimit,
    };
  }
}

