import { SelectQueryBuilder } from 'typeorm';
import { JobQueryDto, JobListSortBy } from '../dto/job-query.dto';

// Applies explore/bookmark listing filters to a query whose job entity uses the given alias (e.g. "job").
export function applyJobListingFilters(
  qb: SelectQueryBuilder<unknown>,
  query: JobQueryDto,
  jobAlias: string,
): void {
  const a = jobAlias;

  if (query.status) {
    qb.andWhere(`${a}.status = :listingStatus`, {
      listingStatus: query.status,
    });
  }

  if (query.categories?.length) {
    qb.andWhere(`${a}.category IN (:...listingCategories)`, {
      listingCategories: query.categories,
    });
  } else if (query.category) {
    qb.andWhere(`${a}.category = :listingCategory`, {
      listingCategory: query.category,
    });
  }

  if (query.search?.trim()) {
    qb.andWhere(
      `(${a}.title ILIKE :listingSearch OR ${a}.description ILIKE :listingSearch OR ${a}.city ILIKE :listingSearch OR ${a}.state ILIKE :listingSearch)`,
      { listingSearch: `%${query.search.trim()}%` },
    );
  }

  if (query.employmentTypes?.length) {
    qb.andWhere(`${a}.employmentType IN (:...employmentTypes)`, {
      employmentTypes: query.employmentTypes,
    });
  }

  if (query.employmentArrangements?.length) {
    qb.andWhere(`${a}.employmentArrangement IN (:...employmentArrangements)`, {
      employmentArrangements: query.employmentArrangements,
    });
  }

  if (query.workModes?.length) {
    qb.andWhere(`${a}.workMode IN (:...workModes)`, {
      workModes: query.workModes,
    });
  }

  const coalesced = `COALESCE(${a}.salary, ${a}.contractFee)`;
  const hasMin =
    query.minCompensation != null && !Number.isNaN(query.minCompensation);
  const hasMax =
    query.maxCompensation != null && !Number.isNaN(query.maxCompensation);

  if (hasMin && hasMax) {
    const lo = Math.min(query.minCompensation, query.maxCompensation);
    const hi = Math.max(query.minCompensation, query.maxCompensation);
    qb.andWhere(
      `(${coalesced} IS NULL OR (${coalesced} >= :compMin AND ${coalesced} <= :compMax))`,
      { compMin: lo, compMax: hi },
    );
  } else if (hasMin) {
    qb.andWhere(`(${coalesced} IS NULL OR ${coalesced} >= :compMinOnly)`, {
      compMinOnly: query.minCompensation,
    });
  } else if (hasMax) {
    qb.andWhere(`(${coalesced} IS NULL OR ${coalesced} <= :compMaxOnly)`, {
      compMaxOnly: query.maxCompensation,
    });
  }

  if (query.postedWithinDays != null && query.postedWithinDays > 0) {
    const from = new Date();
    from.setDate(from.getDate() - query.postedWithinDays);
    qb.andWhere(`${a}.createdAt >= :postedAfter`, { postedAfter: from });
  }
}

// Applies ORDER BY for job list queries based on sortBy (defaults to most recent).
export function applyJobListingSort(
  qb: SelectQueryBuilder<unknown>,
  sortBy: JobListSortBy | undefined,
  jobAlias: string,
): void {
  const a = jobAlias;
  const coalesced = `COALESCE(${a}.salary, ${a}.contractFee)`;

  switch (sortBy) {
    case JobListSortBy.SALARY_HIGH_LOW:
      qb.orderBy(coalesced, 'DESC', 'NULLS LAST').addOrderBy(
        `${a}.createdAt`,
        'DESC',
      );
      break;
    case JobListSortBy.SALARY_LOW_HIGH:
      qb.orderBy(coalesced, 'ASC', 'NULLS LAST').addOrderBy(
        `${a}.createdAt`,
        'DESC',
      );
      break;
    case JobListSortBy.MOST_RELEVANT:
    case JobListSortBy.MOST_RECENT:
    default:
      qb.orderBy(`${a}.createdAt`, 'DESC');
      break;
  }
}
