## Jobs Module

The jobs module encapsulates the full employer job lifecycle for JobStack:

- **Job Management:** Employers can create, update, publish, and close jobs. Admins have oversight for moderation and cleanup.
- **Applications:** Job seekers submit applications and employers progress them through stages. Admins can audit all submissions.
- **Employees:** When an applicant is hired, employers can convert them into employees, tying the relationship to the originating job and profile for downstream payroll/vetting flows.

### Flow

1. Employers create jobs with structured metadata (categories, schedules, skills, salary ranges).
2. Job seekers apply; employers review and move applications through statuses.
3. Once hired, employers register employees, linking the job, jobseeker profile, and employment arrangement for payment operations.
