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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ContractsService } from '../services/contracts.service';
import { EmployerJwtGuard, AdminJwtGuard } from 'apps/api/src/guards';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';
import type { MulterFile } from '@app/common/shared/types';

class CancelContractDto {
  @ApiPropertyOptional({
    description: 'Reason shown on audit trail',
    example: 'Employer requested void before signatures.',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

class GenerateContractDto {
  @ApiProperty({
    description: 'Employee record to generate contract for',
    example: 'c3b2b0c8-1a23-4f6e-9a8b-1234567890ab',
  })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({
    description: 'Template id from GET /contracts/templates',
    example: 'PERMANENT_EMPLOYMENT',
  })
  @IsOptional()
  @IsString()
  templateId?: string;
}

@ApiTags('Contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  /**
   * Get available contract templates
   * GET /contracts/templates
   */
  @Get('templates')
  @UseGuards(EmployerJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List available contract templates' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate employment contract PDF' })
  @ApiBody({ type: GenerateContractDto })
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
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Sign contract as employer (signature image)' })
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
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Sign contract as jobseeker (signature image)' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List contracts for current employer' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List contracts for current jobseeker' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contracts linked to an application' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rendered contract HTML (employer)' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rendered contract HTML (jobseeker)' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contracts for a specific employee' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contract details by id' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all contracts (admin)' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rendered contract HTML (admin)' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Void/cancel a contract (admin)' })
  @ApiBody({ type: CancelContractDto })
  async cancelContract(
    @Param('contractId') contractId: string,
    @Body() dto: CancelContractDto,
  ) {
    const contract = await this.contractsService.cancelContract(
      contractId,
      dto.reason,
    );

    return {
      success: true,
      message: 'Contract cancelled successfully',
      data: contract,
    };
  }
}
