# Vetting System - Backend Documentation for UI/UX

## Feature Overview

**What it does:** Automatically ranks all job applicants and highlights top candidates for admin review, enabling efficient candidate selection and screening workflows.

**Who it affects:** Admins (review and select candidates), Job Seekers (receive notifications when selected for screening), Employers (receive vetted candidates).

**Problem it solves:** Eliminates manual sorting of applications by automatically scoring and ranking candidates based on qualifications, experience, location, and profile completeness.

---

## Backend Flow (Mental Model)

### When a Job is Published

1. **Automatic Trigger:** When a job status changes to "Published", the backend automatically queues a vetting job (runs in background, not blocking).

2. **Vetting Process:**
   - Backend fetches all applications for the job
   - Filters out applicants who are already employed (active employment status)
   - Scores each remaining applicant using multiple factors
   - Ranks all applicants from highest to lowest score
   - Marks top N candidates as "highlighted" (N = 3 by default, or 1 if `performCustomScreening` is false)
   - Updates all application statuses to "Vetted"
   - Records vetting completion timestamp on the job

3. **Notification:** Admin receives email notification that vetting is complete with summary statistics.

### Daily Scheduled Processing

- Backend runs a daily job (2 AM UTC) to re-vet published jobs that have new applications since last vetting
- Only processes jobs that haven't been vetted recently (within last hour) unless manually triggered

### Admin Actions

1. **View Vetted Applicants:** Backend returns all applicants sorted by score, with highlighted status indicated
2. **Adjust Highlighted Count:** Admin can increase/decrease the number of highlighted candidates (1-10 range)
3. **Select for Screening:** 
   - Admin selects specific applicants and **must provide meeting details for each:**
     - Meeting link (required) - URL for the video/phone call (e.g., Google Meet, Zoom, Calendly)
     - Scheduled date & time (required) - When the screening will take place
     - Preparation information (optional) - Additional notes or instructions for the candidate
   - Backend stores these details with each application
   - Backend updates application status to "Selected for Screening"
   - **Backend automatically sends email to candidate** with meeting link, date/time, and prep info
   - This keeps all communication within JobStack (no need to reveal candidate emails externally)
4. **Complete Screening:** After external screening → Admin marks as complete → Candidates receive follow-up email notification

---

## States the Backend Can Be In

### Job Vetting States

- **Not Vetted:** Job has no `vettingCompletedAt` timestamp (vetting hasn't run yet)
- **Vetting In Progress:** Vetting job is queued or processing (check queue status)
- **Vetting Completed:** Job has `vettingCompletedAt` timestamp (ready for admin review)
- **Vetting Failed:** Vetting job encountered an error (check error logs)

### Application States (JobApplicationStatus)

- **APPLIED:** Initial state when candidate applies
- **VETTED:** Application has been scored and ranked by the system
- **SELECTED_FOR_SCREENING:** Admin selected this candidate for screening (candidate notified)
- **SHORTLISTED, INTERVIEWING, OFFERED, HIRED, REJECTED, WITHDRAWN:** Standard application lifecycle states

### Important State Transitions

- `APPLIED` → `VETTED` (automatic, when vetting completes)
- `VETTED` → `SELECTED_FOR_SCREENING` (admin action, triggers candidate notification)
- `SELECTED_FOR_SCREENING` → other states (after external screening completes)

---

## Key Backend Decisions & Rules

### Scoring Algorithm

**High-Skill Jobs:**
- Years of experience (30%), Skill matching (25%), Profile completeness (20%), Proximity (15%), Application speed (10%)

**Low-Skill Jobs:**
- Application speed (40%), Profile completeness (30%), Experience (20%), Proximity (10%)

### Highlighting Rules

- Default highlighted count: **3 candidates**
- If `performCustomScreening` is `false`: Always highlights **1 candidate** (regardless of admin adjustment)
- Admin can adjust highlighted count between **1-10** per job
- Only top-scoring applicants are highlighted; all others remain ranked but unhighlighted

### Filtering Rules

- **Employed applicants are excluded:** Backend automatically filters out candidates with active employment status before scoring
- **All applicants are ranked:** Even non-highlighted applicants receive scores and can be selected by admin

### Validation Rules

- Vetting can only run on jobs with status "Published"
- Vetting skips jobs that were vetted within the last hour (unless manually triggered)
- When selecting candidates for screening, admin **must provide** for each candidate:
  - Application ID (required)
  - Meeting link (required) - Must be a valid URL
  - Scheduled date & time (required) - Must be a valid future date/time
  - Preparation information (optional) - Can be empty
- Backend validates all required fields before processing and sending notifications

---

## UI/UX Implications

### Loading States

- **Initial Vetting:** Show loading indicator when job is first published (vetting may take 10-30 seconds)
- **Manual Re-vetting:** Show queue status when admin manually triggers vetting
- **Fetching Applicants:** Loading state when fetching vetted applicants list

### Empty States

- **No Applications:** Show message if job has no applications yet
- **Vetting Not Complete:** Show "Vetting in progress" or "Vetting not started" message
- **No Highlighted Candidates:** Show message if no candidates meet highlighting criteria

### Success States

- **Vetting Complete:** Display summary (total applicants, highlighted count, completion timestamp)
- **Candidates Selected:** Confirmation message showing how many candidates were selected and notified with meeting details
- **Screening Complete:** Confirmation that notifications were sent
- **Meeting Details Saved:** Confirmation that meeting information has been stored and email sent to candidate

### Error States

- **Vetting Failed:** Show error message with option to retry manual vetting
- **Invalid Selection:** Show validation error if trying to select invalid candidates
- **Missing Meeting Details:** Show validation error if meeting link or scheduled time is missing for any selected candidate
- **Invalid Meeting Link:** Show validation error if meeting link is not a valid URL
- **Invalid Date/Time:** Show validation error if scheduled time is in the past
- **Network Errors:** Handle API failures gracefully with retry options

### Data Display Requirements

- **Ranked List:** Display all applicants sorted by score (highest first)
- **Highlighted Indicator:** Visually distinguish highlighted candidates (unique color/badge as specified)
- **Score Display:** Show individual scores or score breakdown for transparency (optional)
- **Status Badges:** Clear status indicators (Vetted, Selected for Screening, etc.)
- **Profile Completeness:** Show completeness percentage to help admin understand scoring
- **Meeting Details Display:** For candidates with status "Selected for Screening", show:
  - Meeting link (clickable)
  - Scheduled date & time (formatted clearly)
  - Preparation information (if provided)
  - Indication that email was sent

### User Actions to Support

- **Adjust Highlighted Count:** Slider or input field (1-10 range) with immediate visual feedback
- **Select Candidates for Screening:** 
  - Multi-select interface allowing admin to choose any applicant (not just highlighted ones)
  - **Required form fields per selected candidate:**
    - Meeting link input (URL validation)
    - Date & time picker (must be future date/time)
    - Optional text area for preparation information
  - Form validation before submission
  - Show confirmation after successful submission
- **Bulk Actions:** Support selecting multiple candidates at once, but each must have individual meeting details
- **Filter/Search:** Allow filtering by status, score range, or profile attributes
- **View Meeting Details:** Display stored meeting link, scheduled time, and prep info for candidates already selected for screening

### Real-time Considerations

- **Vetting Status:** Poll or use websockets to show when vetting completes
- **Application Updates:** Refresh applicant list when new applications arrive
- **Status Changes:** Update UI when application statuses change (e.g., after screening)

---

## Key Takeaways for UI/UX

1. **All applicants are ranked** - Don't hide non-highlighted candidates; they're still valuable
2. **Highlighting is visual only** - Admin can select any applicant, not just highlighted ones
3. **Vetting is asynchronous** - It happens in background; UI should handle loading states
4. **Meeting details are required** - When selecting candidates for screening, admin must provide meeting link, date/time, and optional prep info for each candidate
5. **Email notifications are automatic** - Backend sends email with meeting details to candidates; UI just needs to show confirmation
6. **Record keeping** - All meeting details are stored in JobStack, providing proper audit trail without revealing candidate emails externally
7. **State-driven UI** - Different UI states based on vetting completion and application statuses