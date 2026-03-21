import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  BadRequestException,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminJwtGuard,
  EmployerJwtGuard,
  EmployeeProbationAccessGuard,
} from 'apps/api/src/guards';
import { EmployeesService } from './employees.service';
import {
  CreateEmployeeDto,
  EmployeeQueryDto,
  UpdateEmployeeDto,
  UpdateEmployeeStatusDto,
} from '../../dto';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // Creates an employee under the authenticated employer
  @Post()
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Create an employee record' })
  @ApiBody({ type: CreateEmployeeDto })
  createEmployee(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeesService.createEmployee(user.id, dto);
  }

  // Lists employees for the employer
  @Get()
  @UseGuards(EmployerJwtGuard)
  getEmployerEmployees(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: EmployeeQueryDto,
  ) {
    return this.employeesService.getEmployerEmployees(user.id, query);
  }

  // Lists employees for admin oversight
  @Get('admin')
  @UseGuards(AdminJwtGuard)
  getAdminEmployees(@Query() query: EmployeeQueryDto) {
    return this.employeesService.getAdminEmployees(query);
  }

  // Retrieves a particular employee for admin
  @Get('admin/:employeeId')
  @UseGuards(AdminJwtGuard)
  getAdminEmployee(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return this.employeesService.getAdminEmployeeById(employeeId);
  }

  // Retrieves a single employee for the employer
  @Get(':employeeId')
  @UseGuards(EmployerJwtGuard)
  getEmployerEmployee(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.employeesService.getEmployerEmployeeById(user.id, employeeId);
  }

  // Retrieves probation status and timing details for an employee.
  @Get(':employeeId/probation-status')
  @UseGuards(EmployeeProbationAccessGuard)
  async getEmployeeProbationStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    const now = new Date();

    const employee =
      user.role === UserRole.ADMIN
        ? await this.employeesService.getAdminEmployeeById(employeeId)
        : user.role === UserRole.EMPLOYER
          ? await this.employeesService.getEmployerEmployeeById(
              user.id,
              employeeId,
            )
          : user.role === UserRole.JOB_SEEKER
            ? await this.employeesService.getJobseekerEmployeeById(
                user.profileId ?? user.id,
                employeeId,
              )
            : null;

    if (!employee) {
      throw new BadRequestException('Unsupported user role');
    }

    const startDate = employee.startDate ?? null;
    const probationEndDate = employee.probationEndDate ?? null;
    const probationStatus = employee.probationStatus ?? null;

    // Whole-day elapsed time in UTC (aligned with SQL DATEDIFF-style logic).
    const daysElapsed = (() => {
      if (!startDate) return 0;
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
      return Math.max(0, Math.floor((nowUtcMidnight - startUtcMidnight) / 86400000));
    })();

    const daysRemaining = Math.max(0, 90 - daysElapsed);

    return {
      probationStatus,
      startDate,
      probationEndDate,
      daysElapsed,
      daysRemaining,
      pulse30SentAt: employee.pulse30SentAt ?? null,
      pulse60SentAt: employee.pulse60SentAt ?? null,
    };
  }

  // Updates employee metadata for the employer
  @Patch(':employeeId')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Update employee details' })
  @ApiBody({ type: UpdateEmployeeDto })
  updateEmployee(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(user.id, employeeId, dto);
  }

  // Updates employee status for the employer
  @Patch(':employeeId/status')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Update employee status' })
  @ApiBody({ type: UpdateEmployeeStatusDto })
  updateEmployeeStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateEmployeeStatusDto,
  ) {
    return this.employeesService.updateEmployeeStatus(user.id, employeeId, dto);
  }
}
