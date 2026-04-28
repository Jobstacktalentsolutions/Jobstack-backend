import { Controller, Post, Body } from '@nestjs/common';
import { SupportService } from './support.service';
import { ContactFormDto } from './dto/contact-form.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('contact')
  async contact(@Body() contactFormDto: ContactFormDto) {
    return this.supportService.handleContactForm(contactFormDto);
  }
}
