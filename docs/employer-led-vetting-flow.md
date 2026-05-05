# Employer-Led Vetting & Hiring Flow

## Overview

JobStack has transitioned from an admin-mediated vetting process to an **Employer-Led Pipeline**. In this model, employers are responsible for reviewing ranked candidates, scheduling screenings, and making final hiring decisions directly through their dashboard.

## The Vetting Lifecycle

### 1. Automatic Ranking (Vetting)
When a job is published, the `JobVettingService` automatically scores and ranks all applicants based on:
- **Skills Match**: Overlap between job requirements and candidate skills.
- **Experience**: Years of experience relative to job seniority.
- **Proximity**: Physical distance, with a high priority on LGA (Local Government Area) matching for low-skill roles.
- **Profile Completeness**: How much of the profile is filled out.
- **Application Speed**: Reward for early applicants.

**Scoring Weights:**
- **High-Skill**: Experience (30%), Skills (25%), Completeness (20%), Proximity (15%), Speed (10%).
- **Low-Skill**: Proximity (35%), Speed (30%), Completeness (20%), Experience (15%).

### 2. Employer Review & PII Unlocking
Ranked candidates appear in the Employer Dashboard with their contact information (email, phone) **masked**.
- Employers can view scores and basic profile details.
- To view contact info and proceed with screening, employers must **pay to unlock** the candidate's PII.
- The `piiUnlocked` flag on the `JobApplication` entity tracks this status.

### 3. Screening (Employer-Led)
Once PII is unlocked, the employer can select candidates for screening.
- **Scheduling**: The employer provides a meeting link (Google Meet, Zoom, etc.), date, time, and optional preparation info.
- **Notifications**: Both the candidate and the employer receive automatic email and in-app notifications. The employer is the host and manager of this call.
- **No Admin Invigilation**: Unlike previous versions, the admin is not required to be present on the call in the standard flow.

### 4. Post-Screening Feedback
After conducting the screening, the employer marks it as complete in the dashboard and provides:
- **Strengths**: What the candidate did well.
- **Concerns**: Potential red flags or areas for improvement.
- **Interview Feedback**: General notes on the candidate's performance.

### 5. Atomic Hiring (Pick Candidate)
When the employer decides on a candidate, they use the "Pick Candidate" action. This is an atomic operation that:
1.  Clears any other pending selections for that job.
2.  Sets the application status to `OFFER_SENT`.
3.  Creates an `Employee` record in the `ONBOARDING` state.
4.  Notifies the jobseeker of the offer.

## Status Transitions

| Status | Trigger |
| :--- | :--- |
| `APPLIED` | Jobseeker applies for the job. |
| `VETTED` | System completes automatic ranking. |
| `SELECTED_FOR_SCREENING` | Employer schedules a meeting. |
| `OFFER_SENT` | Employer selects candidate for hire. |
| `HIRED` | Candidate accepts offer and final steps complete. |

## Key Components

- **Controller**: `JobsEmployerController` (`apps/api/src/modules/jobs/controllers/jobs-employer.controller.ts`)
- **Service**: `JobVettingService` (`apps/api/src/modules/jobs/services/job-vetting.service.ts`)
- **Entity**: `JobApplication` (`libs/common/src/database/entities/JobApplication.entity.ts`)

## Technical Notes

- **Hardcoded `employerWillJoin = true`**: The system assumes employers always manage their own screenings.
- **Re-vetting**: Employers can trigger re-vetting if new applications have arrived since the last ranking.
- **Masking Utility**: `JobVettingService` provides `maskEmail` and `maskPhone` helpers for PII gating.
