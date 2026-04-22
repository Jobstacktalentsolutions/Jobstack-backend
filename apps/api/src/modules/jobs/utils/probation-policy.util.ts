import { BadRequestException } from '@nestjs/common';
import { EmploymentArrangement } from '@app/common/database/entities/schema.enum';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PERMANENT_PROBATION_DAYS = 30;
const CONTRACT_PROBATION_FRACTION = 1 / 3;
const AUTO_CONFIRM_OFFSET_MS = 60 * 1000; // 1 minute after reminder.

export type ProbationSchedule = {
  probationEndDate: Date;
  reminderAt: Date;
  confirmAt: Date;
};

export function buildProbationSchedule(params: {
  employmentArrangement: EmploymentArrangement;
  startDate: Date;
  endDate?: Date | null;
}): ProbationSchedule {
  const { employmentArrangement, startDate } = params;

  if (employmentArrangement === EmploymentArrangement.PERMANENT_EMPLOYEE) {
    const probationEndDate = new Date(
      startDate.getTime() + PERMANENT_PROBATION_DAYS * MS_PER_DAY,
    );
    const reminderAt = probationEndDate;
    const confirmAt = new Date(
      probationEndDate.getTime() + AUTO_CONFIRM_OFFSET_MS,
    );
    return { probationEndDate, reminderAt, confirmAt };
  }

  const endDate = params.endDate ?? null;
  if (!endDate) {
    throw new BadRequestException(
      'Contract endDate is required before confirming hire',
    );
  }

  const contractDurationMs = endDate.getTime() - startDate.getTime();
  if (contractDurationMs <= 0) {
    throw new BadRequestException('Contract endDate must be after startDate');
  }

  const probationDurationMs = Math.max(
    MS_PER_DAY,
    Math.floor(contractDurationMs * CONTRACT_PROBATION_FRACTION),
  );
  const probationEndDate = new Date(startDate.getTime() + probationDurationMs);
  const reminderAt = probationEndDate;
  const confirmAt = new Date(
    probationEndDate.getTime() + AUTO_CONFIRM_OFFSET_MS,
  );

  return { probationEndDate, reminderAt, confirmAt };
}
