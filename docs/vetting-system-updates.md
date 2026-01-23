# Vetting System Updates - Key Changes

## Overview of Changes

This document outlines the significant updates to the automatic vetting system based on new requirements.

## 1. Custom Screening Process Changes

### Previous Behavior:
- When `performCustomScreening` was true, employers would have a separate screening process after admin screening
- Admins would screen and select candidates, then employers would screen again

### New Behavior:
- When `performCustomScreening` is true:
  - **All three parties join the same screening call**: Admin + Employer + Applicant
  - **Admin role**: Invigilator representing JobStack (monitors the process)
  - **Employer role**: Conducts the actual screening and selects candidates for employment
  - **Admin still schedules** the meeting with all details
  - **Both applicant AND employer** receive email notifications with meeting details

- When `performCustomScreening` is false:
  - **Only admin screens** the candidates (traditional process)
  - **Only applicant** receives email notification
  - Admin selects final candidate for the employer

##2. Low-Skill Jobs Ranking Changes

### Previous Behavior:
- Low-skill jobs would have top 1 candidate automatically suggested directly to employers
- Less emphasis on manual screening for low-skill roles

### New Behavior:
- **Low-skill jobs now undergo full manual screening** process like high-skill jobs
- All applicants are ranked and presented to admin
- Admin manually selects candidates for screening
- **Less vigorous ranking criteria** compared to high-skill jobs:
  - More emphasis on proximity (35% vs 15% for high-skill)
  - Less emphasis on experience (15% vs 30% for high-skill)
  - Application speed still important (30%)

## 3. Enhanced Proximity Scoring

### New LGA (Local Government Area) Matching:
- **Same LGA**: Highest score (especially critical for low-skill jobs)
- **Same State**: Medium score
- **Same City**: Medium-high score
- **Different locations**: Low score

### Scoring Weights:

**High-Skill Jobs:**
- Years of experience: 30%
- Skill matching: 25%
- Profile completeness: 20%
- Proximity: 15%
- Application speed: 10%

**Low-Skill Jobs:**
- Proximity: 35% (emphasizing local availability)
- Application speed: 30%
- Profile completeness: 20%
- Experience: 15%

## 4. Email Notification Changes

### Screening Selection Notifications:

**When performCustomScreening = true:**
- **Applicant** receives: Meeting link, date/time, prep info
- **Employer** receives: Meeting link, date/time, applicant info, screening instructions
- **Admin** receives: Confirmation that screening is scheduled

**When performCustomScreening = false:**
- **Applicant** receives: Meeting link, date/time, prep info
- **Employer** receives: Notification that screening is in progress (optional)
- **Admin** receives: Confirmation that screening is scheduled

## 5. Implementation Requirements

### Database Changes:
- No new schema changes required (existing fields sufficient)
- `performCustomScreening` field on Job entity already exists

### Code Changes:
1. **JobVettingService.notifyCandidatesForScreening()**:
   - Check job's `performCustomScreening` flag
   - If true: Send emails to both applicant AND employer
   - If false: Send email to applicant only

2. **Proximity Scoring**:
   - Enhance `calculateProximityScore()` to consider LGA matching
   - Use existing location fields (state, city, address) for matching
   - Implement LGA extraction/matching logic

3. **Scoring Weights**:
   - Update `VETTING_CONFIG` to adjust low-skill job weights
   - Increase proximity weight to 35% for low-skill jobs
   - Decrease experience weight to 15% for low-skill jobs

4. **Email Templates**:
   - Create new template: `employer-screening-invitation.ejs`
   - Update existing template: `candidate-selected-for-screening.ejs` (to indicate if employer will be present)

### API Changes:
- `select-for-screening` endpoint remains the same
- Backend automatically determines who to notify based on `performCustomScreening` flag

## 6. UI/UX Implications

### Admin Dashboard:
- When selecting candidates, show indicator if employer will participate (based on `performCustomScreening`)
- Meeting scheduling form should indicate who will join the call
- Confirmation message should specify who received notifications

### Employer Dashboard:
- For jobs with `performCustomScreening = true`:
  - Show notification when candidates are selected for screening
  - Display screening schedule with meeting link
  - Provide guidance on conducting screening with admin present

### Job Seeker Dashboard:
- Application status should indicate if employer will be present in screening
- Meeting details should clarify the screening format (admin-only vs admin+employer)

## Summary of Key Points

1. ✅ **Both high-skill and low-skill jobs undergo manual screening** (no automatic selection)
2. ✅ **Custom screening means employer participates** in the same call with admin and applicant
3. ✅ **Admin always schedules** meetings regardless of `performCustomScreening` setting
4. ✅ **Proximity is more important** for low-skill jobs (35% weight)
5. ✅ **Employer receives meeting details** when `performCustomScreening` is true
6. ✅ **LGA matching** provides highest proximity score for local candidates