import { Controller, Post, Body } from '@nestjs/common';
import { SupportService } from './support.service';
import { ContactFormDto } from './dto/contact-form.dto';
import { RateLimit } from 'apps/api/src/guards';

@Controller('support')
@RateLimit({ limit: 3, ttlSeconds: 3600 })
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('contact')
  @RateLimit({ limit: 3, ttlSeconds: 3600 })
  async contact(@Body() contactFormDto: ContactFormDto) {
    return this.supportService.handleContactForm(contactFormDto);
  }
}
