export interface SimpleWorkExperience {
  startDate: string | Date;
  endDate?: string | Date;
  isCurrent?: boolean;
}

/**
 * Calculates total years of experience from an array of work experiences,
 * accounting for overlapping intervals.
 */
export function calculateYearsOfExperience(
  workExperience: SimpleWorkExperience[],
): number {
  if (!workExperience || workExperience.length === 0) return 0;

  const now = new Date();
  const intervals = workExperience
    .map((exp) => ({
      start: new Date(exp.startDate),
      end: exp.isCurrent || !exp.endDate ? now : new Date(exp.endDate),
    }))
    .filter(
      (interval) =>
        !isNaN(interval.start.getTime()) && !isNaN(interval.end.getTime()),
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (intervals.length === 0) return 0;

  // Merge overlapping intervals
  const merged: { start: Date; end: Date }[] = [];
  let current = { ...intervals[0] };

  for (let i = 1; i < intervals.length; i++) {
    const next = intervals[i];
    if (next.start <= current.end) {
      // Overlap, extend current end if next end is further
      if (next.end > current.end) {
        current.end = next.end;
      }
    } else {
      // No overlap, push current and move to next
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  // Sum up durations in months
  let totalMonths = 0;
  for (const interval of merged) {
    const months =
      (interval.end.getFullYear() - interval.start.getFullYear()) * 12 +
      (interval.end.getMonth() - interval.start.getMonth());
    totalMonths += Math.max(0, months);
  }

  const years = totalMonths / 12;
  return Math.round(years * 10) / 10;
}
