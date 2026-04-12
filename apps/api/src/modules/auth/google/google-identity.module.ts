import { Module } from '@nestjs/common';
import { GoogleIdentityService } from './google-identity.service';

@Module({
  providers: [GoogleIdentityService],
  exports: [GoogleIdentityService],
})
export class GoogleIdentityModule {}
