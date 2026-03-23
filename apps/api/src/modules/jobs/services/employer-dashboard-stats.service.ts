import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Employee, Job } from '@app/common/database/entities';
import { EmployeeStatus, JobStatus } from '@app/common/database/entities/schema.enum';

export type EmployerDashboardStats = {
  jobsLive: number;
  thisMonthPayroll: number;
  totalActiveStaff: number;
  newHires: number;
};

@Injectable()
export class EmployerDashboardStatsService {
  constructor(
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  // Computes employer dashboard KPI values without relying on pagination limits.
  async getEmployerDashboardStats(
    employerId: string,
  ): Promise<EmployerDashboardStats> {
    const now = new Date();
    const startOfMonthUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );
    const startOfNextMonthUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
    );

    const [jobsLive, totalActiveStaff, newHires, payrollRaw] =
      await Promise.all([
        this.jobRepo.count({
          where: { employerId, status: JobStatus.ACTIVE },
        }),
        this.employeeRepo.count({
          where: { employerId, status: EmployeeStatus.ACTIVE },
        }),
        this.employeeRepo.count({
          where: {
            employerId,
            status: EmployeeStatus.ONBOARDING,
            startDate: Between(startOfMonthUtc, startOfNextMonthUtc),
          },
        }),
        this.employeeRepo
          .createQueryBuilder('employee')
          .select(
            'COALESCE(SUM(COALESCE(employee.salaryOffered,0) + COALESCE(employee.contractFeeOffered,0)),0)',
            'thisMonthPayroll',
          )
          .where('employee.employerId = :employerId', { employerId })
          .andWhere(
            'employee.startDate >= :startOfMonthUtc AND employee.startDate < :startOfNextMonthUtc',
            { startOfMonthUtc, startOfNextMonthUtc },
          )
          .getRawOne<{ thisMonthPayroll: string | number }>(),
      ]);

    const thisMonthPayroll = Number(payrollRaw?.thisMonthPayroll ?? 0);

    return {
      jobsLive,
      thisMonthPayroll: Number.isFinite(thisMonthPayroll)
        ? thisMonthPayroll
        : 0,
      totalActiveStaff,
      newHires,
    };
  }
}

