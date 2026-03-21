import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiService } from './api.service';

@ApiTags('Health')
@Controller()
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get()
  @ApiOperation({ summary: 'Root greeting' })
  getHello(): string {
    return this.apiService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Liveness check' })
  getHealth(): string {
    return 'OK';
  }
}
