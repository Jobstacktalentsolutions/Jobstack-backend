import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { CommonModule, ConfigModule, LoggerModule } from '@app/common';

@Module({
  imports: [ConfigModule, LoggerModule, CommonModule],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
