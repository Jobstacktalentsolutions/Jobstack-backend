import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from 'apps/api/src/guards';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '@app/common/database/entities';
import { ProbationStatus } from '@app/common/database/entities/schema.enum';

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
      .where('employee.probationStatus = :probationStatus', {
        probationStatus: ProbationStatus.ACTIVE,
      })
      .orderBy('employee.startDate', 'ASC')
      .skip(skip)
      .take(currentLimit)
      .getManyAndCount();

    const mapDays = (startDate?: Date, endDate?: Date) => {
      if (!startDate || !endDate)
        return { daysRemaining: null, daysElapsed: 0 };

      const startUtcMidnight = Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
      );
      const endUtcMidnight = Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
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
      const daysRemaining = Math.max(
        0,
        Math.ceil((endUtcMidnight - nowUtcMidnight) / 86400000),
      );

      return { daysElapsed, daysRemaining };
    };

    return {
      items: items.map((e) => {
        const { daysRemaining } = mapDays(
          e.startDate,
          e.probationEndDate ?? undefined,
        );
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
          probationEndDate: e.probationEndDate ?? null,
          daysRemaining,
          reminderSentAt: e.pulse30SentAt ?? null,
          probationStatus: e.probationStatus ?? null,
          // Keep explicit boolean for easy UI rendering.
          reminderSent: !!e.pulse30SentAt,
        };
      }),
      total,
      page: currentPage,
      limit: currentLimit,
    };
  }
}
