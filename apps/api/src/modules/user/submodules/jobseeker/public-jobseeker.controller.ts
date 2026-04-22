import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { JobseekerService } from './jobseeker.service';

@Controller('public/jobseekers')
export class PublicJobseekerController {
  constructor(private readonly jobseekerService: JobseekerService) {}

  /**
   * Public endpoint: returns a sanitized jobseeker profile by slug.
   * GET /public/jobseekers/:slug
   */
  @Get(':slug')
  async getPublicJobseeker(@Param('slug') slug: string) {
    const profile =
      await this.jobseekerService.getJobSeekerPublicProfileBySlug(slug);

    if (!profile) {
      throw new NotFoundException('Jobseeker not found');
    }

    return profile;
  }
}
