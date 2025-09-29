import { Controller, Get } from '@nestjs/common';
import { BackgroundService } from './background.service';

@Controller()
export class BackgroundController {
  constructor(private readonly backgroundService: BackgroundService) {}

  @Get()
  getHello(): string {
    return this.backgroundService.getHello();
  }
}
