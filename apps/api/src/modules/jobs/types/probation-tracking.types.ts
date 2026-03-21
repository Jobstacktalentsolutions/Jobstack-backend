import type { Employee, JobApplication } from '@app/common/database/entities';

/**
 * Bull job names for probation tracking.
 */
export const JOB_PROBATION_TRACKING_JOBS = {
  DAY30_PULSE: 'day30-pulse',
  DAY60_PULSE: 'day60-pulse',
  DAY90_CONFIRM: 'day90-confirm',
} as const;

export type DayPulseJobData = {
  // Employee record that contains probation dates and recipient info.
  employeeId: string;
};

export type Day90ConfirmJobData = {
  employeeId: string;
};

// Small aliases to make service/consumer signatures easier to read.
export type EmployeeRecord = Employee;
export type JobApplicationRecord = JobApplication;

