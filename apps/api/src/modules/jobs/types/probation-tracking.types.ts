import type { Employee, JobApplication } from '@app/common/database/entities';

/**
 * Bull job names for probation tracking.
 */
export const JOB_PROBATION_TRACKING_JOBS = {
  PROBATION_REMINDER: 'probation-reminder',
  PROBATION_CONFIRM: 'probation-confirm',
} as const;

export type ProbationReminderJobData = {
  // Employee record that contains probation dates and recipient info.
  employeeId: string;
};

export type ProbationConfirmJobData = {
  employeeId: string;
};

// Small aliases to make service/consumer signatures easier to read.
export type EmployeeRecord = Employee;
export type JobApplicationRecord = JobApplication;
