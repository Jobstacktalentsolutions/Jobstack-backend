import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { ContractsService } from '../services/contracts.service';
import { EmployerJwtGuard } from 'apps/api/src/guards';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';

class GenerateContractDto {
  employeeId: string;
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
  @HttpCode(HttpStatus.OK)
  async employerSignContract(
    @Param('contractId') contractId: string,
    @Req() req: any,
    @Ip() ipAddress: string,
  ) {
    const userId = req.user.id;

    const contract = await this.contractsService.signContract(
      contractId,
      userId,
      'employer',
      ipAddress,
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
  @HttpCode(HttpStatus.OK)
  async employeeSignContract(
    @Param('contractId') contractId: string,
    @Req() req: any,
    @Ip() ipAddress: string,
  ) {
    const userId = req.user.id;

    const contract = await this.contractsService.signContract(
      contractId,
      userId,
      'employee',
      ipAddress,
    );

    return {
      success: true,
      message: 'Contract signed successfully',
      data: contract,
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
   * Download contract PDF
   * GET /contracts/:contractId/download
   * Returns the signed URL to the contract document
   */
  @Get(':contractId/download')
  @UseGuards(EmployerJwtGuard)
  async downloadContract(@Param('contractId') contractId: string) {
    const contract = await this.contractsService.getContractById(contractId);

    if (!contract.contractDocument) {
      return {
        success: false,
        message: 'Contract document not found',
      };
    }

    return {
      success: true,
      data: {
        url: contract.contractDocument.url,
        name: contract.contractDocument.originalName,
      },
    };
  }
}
