import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { EmployerService } from './employer.service';

@Controller('public/employers')
export class PublicEmployerController {
  constructor(private readonly employerService: EmployerService) {}

  /**
   * Public endpoint: returns a sanitized employer profile by slug.
   * GET /public/employers/:slug
   */
  @Get(':slug')
  async getPublicEmployer(@Param('slug') slug: string) {
    const profile =
      await this.employerService.getEmployerPublicProfileBySlug(slug);

    if (!profile) {
      throw new NotFoundException('Employer not found');
    }

    return profile;
  }
}
