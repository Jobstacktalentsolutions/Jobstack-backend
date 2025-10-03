import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { DatabaseModule } from './database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [CommonService],
  exports: [CommonService, DatabaseModule],
})
export class CommonModule {}
