import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard, EmployerJwtGuard } from 'apps/api/src/guards';
import { EmployeesService } from './employees.service';
import {
  CreateEmployeeDto,
  EmployeeQueryDto,
  UpdateEmployeeDto,
  UpdateEmployeeStatusDto,
} from '../../dto';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // Creates an employee under the authenticated employer
  @Post()
  @UseGuards(EmployerJwtGuard)
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

  // Updates employee metadata for the employer
  @Patch(':employeeId')
  @UseGuards(EmployerJwtGuard)
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
  updateEmployeeStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateEmployeeStatusDto,
  ) {
    return this.employeesService.updateEmployeeStatus(user.id, employeeId, dto);
  }
}
