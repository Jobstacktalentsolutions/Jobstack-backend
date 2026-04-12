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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtGuard,
  EmployerJwtGuard,
  EmployeeProbationAccessGuard,
} from 'apps/api/src/guards';
import { EmployeesService } from './employees.service';
import {
  CreateEmployeeDto,
  DeclareEmploymentCompletionDto,
  EmployeeQueryDto,
  SubmitEmploymentFeedbackDto,
  UpdateEmployeeDto,
  UpdateEmployeeStatusDto,
} from '../../dto';
import { EmploymentCompletionService } from '../../services/employment-completion.service';
import { EmploymentFeedbackService } from '../../services/employment-feedback.service';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly employmentCompletionService: EmploymentCompletionService,
    private readonly employmentFeedbackService: EmploymentFeedbackService,
  ) {}

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

  // Employer declares mutual completion for a placement (second party finalizes to ENDED).
  @Post(':employeeId/completion/declare')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Declare mutual employment completion (employer)' })
  @ApiBody({ type: DeclareEmploymentCompletionDto })
  declareEmploymentCompletionEmployer(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: DeclareEmploymentCompletionDto,
  ) {
    return this.employmentCompletionService.declareCompleteAsEmployer(
      user.id,
      employeeId,
      dto.note,
    );
  }

  // Returns employer-authored feedback for this employment if it exists.
  @Get(':employeeId/feedback/me')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({
    summary: 'Get employer feedback for an employment (if submitted)',
  })
  async getMyEmployerEmploymentFeedback(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    const feedback =
      await this.employmentFeedbackService.getEmployerFeedbackForEmployee(
        user.id,
        employeeId,
      );
    return { feedback };
  }

  // Submits employer feedback after declaring completion or via termination flow.
  @Post(':employeeId/feedback')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Submit employment feedback (employer)' })
  @ApiBody({ type: SubmitEmploymentFeedbackDto })
  async submitEmployerEmploymentFeedback(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() body: SubmitEmploymentFeedbackDto,
  ) {
    const feedback =
      await this.employmentFeedbackService.submitEmployerFeedback(
        user.id,
        employeeId,
        body,
      );
    return { feedback };
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
      return Math.max(
        0,
        Math.floor((nowUtcMidnight - startUtcMidnight) / 86400000),
      );
    })();

    const daysRemaining = (() => {
      if (!probationEndDate) return null;

      const probationEndUtcMidnight = Date.UTC(
        probationEndDate.getUTCFullYear(),
        probationEndDate.getUTCMonth(),
        probationEndDate.getUTCDate(),
      );
      const nowUtcMidnight = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
      );

      return Math.max(
        0,
        Math.ceil((probationEndUtcMidnight - nowUtcMidnight) / 86400000),
      );
    })();

    return {
      probationStatus,
      startDate,
      probationEndDate,
      daysElapsed,
      daysRemaining,
      reminderSentAt: employee.pulse30SentAt ?? null,
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
