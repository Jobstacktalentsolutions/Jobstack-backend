import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobBookmark } from '@app/common/database/entities';
import { isJobOpenOnMarketplace } from '@app/common/database/entities/schema.enum';
import { JobQueryDto } from '../dto';
import { applyJobListingFilters } from '../utils/job-listing-filters.util';

@Injectable()
export class JobBookmarksService {
  constructor(
    @InjectRepository(JobBookmark)
    private readonly bookmarkRepo: Repository<JobBookmark>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  // Returns true when a job can be newly bookmarked (live marketplace listing).
  private isJobBookmarkable(job: Job, now: Date): boolean {
    if (!isJobOpenOnMarketplace(job.status)) {
      return false;
    }
    if (job.applicationDeadline && new Date(job.applicationDeadline) <= now) {
      return false;
    }
    return true;
  }

  // Adds a bookmark if missing; validates listing rules only for new rows.
  async add(jobseekerProfileId: string, jobId: string): Promise<void> {
    const existing = await this.bookmarkRepo.findOne({
      where: { jobseekerProfileId, jobId },
    });
    if (existing) {
      return;
    }

    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const now = new Date();
    if (!this.isJobBookmarkable(job, now)) {
      throw new BadRequestException(
        'This job is not available to save right now (closed or past deadline).',
      );
    }

    await this.bookmarkRepo.save(
      this.bookmarkRepo.create({ jobseekerProfileId, jobId }),
    );
  }

  // Removes a bookmark for the current jobseeker.
  async remove(jobseekerProfileId: string, jobId: string): Promise<void> {
    const res = await this.bookmarkRepo.delete({ jobseekerProfileId, jobId });
    if (!res.affected) {
      throw new NotFoundException('Bookmark not found');
    }
  }

  // All bookmarked job IDs for quick UI state on Explore.
  async listJobIds(jobseekerProfileId: string): Promise<string[]> {
    const rows = await this.bookmarkRepo.find({
      where: { jobseekerProfileId },
      select: ['jobId'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => r.jobId);
  }

  // Paginated bookmarked jobs (includes closed listings the user saved earlier).
  async listBookmarks(jobseekerProfileId: string, query: JobQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const qb = this.bookmarkRepo
      .createQueryBuilder('bm')
      .innerJoinAndSelect('bm.job', 'job')
      .addSelect(
        '(SELECT COUNT(*)::int FROM job_applications ja WHERE ja."jobId" = job.id)',
        'job_applicantsCount',
      )
      .leftJoinAndSelect('job.skills', 'skill')
      .leftJoinAndSelect('job.employer', 'employer')
      .where('bm.jobseekerProfileId = :jobseekerProfileId', {
        jobseekerProfileId,
      })
      .orderBy('bm.createdAt', 'DESC');

    applyJobListingFilters(qb, query, 'job');

    qb.take(limit).skip((page - 1) * limit);

    const [items, total] = await qb.getManyAndCount();
    const jobs = items.map((b) => b.job);
    return { items: jobs, total, page, limit };
  }
}
