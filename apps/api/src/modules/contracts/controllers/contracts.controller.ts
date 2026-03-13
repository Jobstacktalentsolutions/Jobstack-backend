import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ContractsService } from '../services/contracts.service';
import { EmployerJwtGuard, AdminJwtGuard } from 'apps/api/src/guards';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';
import type { MulterFile } from '@app/common/shared/types';

class CancelContractDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

class GenerateContractDto {
  @IsUUID()
  employeeId: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  /**
   * Get available contract templates
   * GET /contracts/templates
   */
  @Get('templates')
  @UseGuards(EmployerJwtGuard)
  async getTemplates() {
    const templates = await this.contractsService.getAvailableTemplates();

    return {
      success: true,
      data: templates,
    };
  }

  /**
   * Generate contract for an employee
   * POST /contracts/generate
   */
  @Post('generate')
  @UseGuards(EmployerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async generateContract(@Body() dto: GenerateContractDto, @Req() req: any) {
    const contract = await this.contractsService.generateEmploymentContract(
      dto.employeeId,
      dto.templateId,
    );

    return {
      success: true,
      message: 'Contract generated successfully',
      data: contract,
    };
  }

  /**
   * Sign contract as employer
   * POST /contracts/:contractId/sign/employer
   */
  @Post(':contractId/sign/employer')
  @UseGuards(EmployerJwtGuard)
  @UseInterceptors(FileInterceptor('signatureImage'))
  @HttpCode(HttpStatus.OK)
  async employerSignContract(
    @Param('contractId') contractId: string,
    @Req() req: any,
    @Ip() ipAddress: string,
    @UploadedFile() signatureImage?: MulterFile,
  ) {
    const userId = req.user.id;

    const contract = await this.contractsService.signContract(
      contractId,
      userId,
      'employer',
      ipAddress,
      signatureImage,
    );

    return {
      success: true,
      message: 'Contract signed successfully',
      data: contract,
    };
  }

  /**
   * Sign contract as employee
   * POST /contracts/:contractId/sign/employee
   */
  @Post(':contractId/sign/employee')
  @UseGuards(JobSeekerJwtGuard)
  @UseInterceptors(FileInterceptor('signatureImage'))
  @HttpCode(HttpStatus.OK)
  async employeeSignContract(
    @Param('contractId') contractId: string,
    @Req() req: any,
    @Ip() ipAddress: string,
    @UploadedFile() signatureImage?: MulterFile,
  ) {
    const userId = req.user.id;

    const contract = await this.contractsService.signContract(
      contractId,
      userId,
      'employee',
      ipAddress,
      signatureImage,
    );

    return {
      success: true,
      message: 'Contract signed successfully',
      data: contract,
    };
  }

  /**
   * Get all contracts for the authenticated employer
   * GET /contracts/employer/mine
   */
  @Get('employer/mine')
  @UseGuards(EmployerJwtGuard)
  async getEmployerContracts(@Req() req: any) {
    const employerId = req.user.id;
    const contracts =
      await this.contractsService.getContractsByEmployerId(employerId);

    return {
      success: true,
      data: contracts,
    };
  }

  /**
   * Get all contracts for the authenticated jobseeker
   * GET /contracts/jobseeker/mine
   */
  @Get('jobseeker/mine')
  @UseGuards(JobSeekerJwtGuard)
  async getJobseekerContracts(@Req() req: any) {
    const jobseekerProfileId = req.user.profileId ?? req.user.id;
    const contracts =
      await this.contractsService.getContractsByJobseekerId(jobseekerProfileId);

    return {
      success: true,
      data: contracts,
    };
  }

  /**
   * Get contract for a specific job application (jobseeker-facing)
   * GET /contracts/jobseeker/by-application/:applicationId
   */
  @Get('jobseeker/by-application/:applicationId')
  @UseGuards(JobSeekerJwtGuard)
  async getContractsByApplication(
    @Param('applicationId') applicationId: string,
    @Req() req: any,
  ) {
    const jobseekerProfileId = req.user.profileId ?? req.user.id;
    const contracts = await this.contractsService.getContractsByApplicationId(
      applicationId,
      jobseekerProfileId,
    );

    return {
      success: true,
      data: contracts,
    };
  }

  /**
   * Get rendered HTML for a contract (employer)
   * GET /contracts/:contractId/html
   */
  @Get(':contractId/html')
  @UseGuards(EmployerJwtGuard)
  async getContractHtml(@Param('contractId') contractId: string) {
    const html = await this.contractsService.getContractHtml(contractId);

    return {
      success: true,
      data: { html },
    };
  }

  /**
   * Get rendered HTML for a contract (jobseeker)
   * GET /contracts/:contractId/html/jobseeker
   */
  @Get(':contractId/html/jobseeker')
  @UseGuards(JobSeekerJwtGuard)
  async getContractHtmlForJobseeker(@Param('contractId') contractId: string) {
    const html = await this.contractsService.getContractHtml(contractId);

    return {
      success: true,
      data: { html },
    };
  }

  /**
   * Get contracts for an employee
   * GET /contracts/employee/:employeeId
   */
  @Get('employee/:employeeId')
  @UseGuards(EmployerJwtGuard)
  async getEmployeeContracts(@Param('employeeId') employeeId: string) {
    const contracts =
      await this.contractsService.getContractsByEmployeeId(employeeId);

    return {
      success: true,
      data: contracts,
    };
  }

  /**
   * Get contract details
   * GET /contracts/:contractId
   */
  @Get(':contractId')
  @UseGuards(EmployerJwtGuard)
  async getContract(@Param('contractId') contractId: string) {
    const contract = await this.contractsService.getContractById(contractId);

    return {
      success: true,
      data: contract,
    };
  }

  // ─── Admin Endpoints ───────────────────────────────────────────────────────

  /**
   * Get all contracts (admin)
   * GET /contracts/admin/all
   */
  @Get('admin/all')
  @UseGuards(AdminJwtGuard)
  async getAllContracts() {
    const contracts = await this.contractsService.getAllContracts();

    return {
      success: true,
      data: contracts,
    };
  }

  /**
   * Get rendered HTML for a contract (admin)
   * GET /contracts/:contractId/html/admin
   */
  @Get(':contractId/html/admin')
  @UseGuards(AdminJwtGuard)
  async getContractHtmlForAdmin(@Param('contractId') contractId: string) {
    const html = await this.contractsService.getContractHtml(contractId);

    return {
      success: true,
      data: { html },
    };
  }

  /**
   * Cancel (void) a contract — admin action
   * POST /contracts/:contractId/cancel
   */
  @Post(':contractId/cancel')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async cancelContract(
    @Param('contractId') contractId: string,
    @Body() dto: CancelContractDto,
  ) {
    const contract = await this.contractsService.cancelContract(contractId, dto.reason);

    return {
      success: true,
      message: 'Contract cancelled successfully',
      data: contract,
    };
  }

}
