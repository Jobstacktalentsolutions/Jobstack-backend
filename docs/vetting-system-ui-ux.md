# Vetting System - Backend Documentation for UI/UX

## Feature Overview

**What it does:** Automatically ranks all job applicants (both high-skill and low-skill) and highlights top candidates for employer review. Enables employers to manage their own candidate pipeline, from ranking to screening and hiring.

**Who it affects:** Employers (review and select candidates, schedule screenings), Job Seekers (receive screening notifications and offers), Admins (system oversight).

**Problem it solves:** Eliminates manual sorting of applications by automatically scoring and ranking candidates based on qualifications, experience, location (including LGA matching), and profile completeness. Empowers employers to directly engage with top talent through a structured, data-driven pipeline.

---

## Backend Flow (Mental Model)

### When a Job is Published

1. **Automatic Trigger:** When a job status changes to "Published", the backend automatically queues a vetting job (background process).

2. **Vetting Process:**
   - Backend fetches all applications for the job.
   - Filters out applicants who are already employed (active status).
   - Scores each remaining applicant using multi-factor weights.
   - Ranks all applicants from highest to lowest score.
   - Marks top N candidates as "highlighted" (N = 3 by default).
   - Updates application statuses to "Vetted".
   - Records vetting completion timestamp on the job.

3. **Notification:** The **Employer** receives email and in-app notifications that vetting is complete and candidates are ranked.

### Daily/On-Demand Processing

- Backend runs a daily job (2 AM UTC) to re-vet published jobs with new applications.
- Employers can trigger re-vetting from their dashboard if they see many new unvetted applicants.

### Employer Actions

1. **View Ranked Applicants:** Employer views the list of applicants sorted by score.
   - **PII Gating**: Contact info (email/phone) is masked initially.
   - **Unlock PII**: Employer pays to unlock a candidate's full profile.
2. **Adjust Highlighted Count:** Employer can increase/decrease the number of highlighted candidates (1-10 range) to focus their review.
3. **Select for Screening:**
   - Employer selects specific applicants and **schedules the meeting:**
     - Meeting link (required) - URL for the video/phone call (e.g., Google Meet, Zoom).
     - Scheduled date & time (required).
     - Preparation information (optional).
     - Duration (optional).
   - Backend updates application status to "Selected for Screening".
   - **Direct Notification**: Both applicant AND employer receive email with meeting details. The employer is treated as the host/manager of the screening.
4. **Complete Screening:** After the call, the employer marks screening as complete and provides feedback (Strengths, Concerns, Interview Feedback).
5. **Pick Candidate (Hire):** Employer selects a candidate for the job.
   - Backend clears other selections, sets status to "Offer Sent", creates an Employee record (Onboarding), and notifies the jobseeker.

---

## States the Backend Can Be In

### Job Vetting States

- **Not Vetted:** Job hasn't run through the ranking system yet.
- **Vetting In Progress:** Queue is currently processing applicants.
- **Vetting Completed:** Rankings are ready for employer review.

### Application States (JobApplicationStatus)

- **APPLIED:** Initial state.
- **VETTED:** System has scored and ranked the candidate.
- **SELECTED_FOR_SCREENING:** Employer has scheduled a meeting.
- **OFFER_SENT:** Employer has selected the candidate for hire (atomic action).
- **SHORTLISTED, INTERVIEWING, HIRED, REJECTED:** Pipeline management states.

---

## Key Backend Decisions & Rules

### Scoring Algorithm

**High-Skill Jobs:**
- Experience (30%), Skills (25%), Completeness (20%), Proximity (15%), Speed (10%).

**Low-Skill Jobs:**
- Proximity (35%), Speed (30%), Completeness (20%), Experience (15%).

### Proximity Scoring:
- **Same City/LGA (Local Government Area):** 100 points (Perfect match).
- **Same State:** 50 points.
- Prioritizes local talent to reduce commute friction, especially for low-skill roles.

### Highlighting Rules
- Default: **3 candidates**.
- Employer can adjust between **1-10**.
- Only top-scoring applicants are highlighted for quick identification.

### Filtering & Validation
- **Employed Exclusion**: Active employees are skipped during vetting.
- **Payment Requirement**: `piiUnlocked` must be true before scheduling screening or hiring.
- **Mandatory Meeting Info**: Scheduling requires a link and a future date/time.

---

## UI/UX Implications (Employer-Centric)

### Employer Dashboard

**Vetted Applicants View:**
- List sorted by score (highest first).
- Highlighted candidates at the top with distinct styling.
- Masked PII fields (email, phone) with "Pay to Unlock" buttons.
- Status badges (Vetted, Selected for Screening, etc.).

**Actions & Modals:**
- **Schedule Screening Modal**: 
  - Form for Meeting Link, Date/Time, and Prep Info.
  - Confirmation that the candidate will be notified immediately.
- **Complete Screening Modal**:
  - Fields for strengths, concerns, and interview feedback.
  - Action to move to next stage or hire.
- **Pick Candidate Modal**:
  - Final confirmation to send offer and create employee record.
  - Form for Start Date and optional notes.

### Job Seeker Dashboard

**Application Details:**
- View screening details (Link, Time, Prep Info) directly in the app.
- Clear indication that the Employer (not just "JobStack") is conducting the screening.
- Instant access to meeting links and calendar integration.

---

## Key Takeaways for UI/UX

1. **Employer-Led**: The employer is the primary driver of the recruitment pipeline.
2. **Manual Review for All**: Both high-skill and low-skill roles require employer selection.
3. **PII Gating**: Contact info is a paid feature, requiring a clear unlock flow.
4. **Direct Scheduling**: Employers provide their own meeting links, keeping the process flexible.
5. **Atomic Hiring**: Selection for hire is a single, powerful action that triggers offers and onboarding.
