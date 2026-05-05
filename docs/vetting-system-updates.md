# Vetting System Updates - Key Changes

## Overview of Changes

This document outlines the significant updates to the automatic vetting system, focusing on the shift to an employer-led candidate pipeline.

## 1. Employer-Led Screening Process

### Previous Behavior:
- Admins would screen and select candidates, then employers would screen again.
- When `performCustomScreening` was true, both parties would join the call, but admin scheduled it.

### New Behavior:
- **Employers manage the entire pipeline**: Once candidates are ranked (VETTED status), the employer takes control.
- **Employer schedules screening**: The employer provides the meeting link, date, and time via the dashboard.
- **Direct Communication**: Notifications go directly to the candidate and the employer.
- **Standard Flow**: The admin is no longer an "invigilator" in the standard flow. Employers conduct their own screenings and provide feedback in the system.

## 2. Low-Skill Jobs Ranking Changes

### Previous Behavior:
- Low-skill jobs would have top candidates automatically suggested, bypassing manual review.

### New Behavior:
- **Low-skill jobs now undergo manual screening by the employer**: All applicants are ranked and presented to the employer for review.
- **Less vigorous ranking criteria**:
  - More emphasis on **Proximity (35%)** (ensuring local availability).
  - Less emphasis on **Experience (15%)**.
  - **Application Speed (30%)** remains a high priority to reward early applicants.

## 3. Enhanced Proximity Scoring

### LGA (Local Government Area) Matching:
- **Perfect Match (100 points)**: Exact city/LGA match.
- **State Match (50 points)**: Same state but different city.
- This is critical for low-skill roles where local commute is a primary factor.

## 4. Payment Gating (PII Unlock)

### Workflow:
- Candidate contact info (email, phone) is **masked** in the employer dashboard.
- Employers must **pay to unlock** a candidate's PII before they can schedule a screening or make a hire.
- Once paid, the `piiUnlocked` flag is set to true on the `JobApplication` entity.

## 5. Implementation Summary

### Database Schema:
- `JobApplication` entity holds all screening data:
  - `screeningMeetingLink`: URL for the call.
  - `screeningScheduledAt`: Time of the meeting.
  - `screeningPrepInfo`: Instructions for the candidate.
  - `piiUnlocked`: Boolean flag for payment status.
  - `screeningStrengths/Concerns/InterviewFeedback`: Employer's post-screening notes.

### Core Service Changes:
1. **JobVettingService.notifyCandidatesForScreening()**:
   - Notifies both candidate and employer.
   - Assumes employer is the host and manager of the call.

2. **JobVettingService.notifyEmployerVettingComplete()**:
   - Sends notification to the employer when candidates are ranked and ready for review.

3. **JobVettingService.employerPickCandidate()**:
   - Allows employer to hire a candidate in one step, creating an employee record and sending an offer.

## 6. UI/UX Implications

### Employer Dashboard:
- Review ranked candidates with masked PII.
- Trigger payment to unlock candidate details.
- Schedule screenings directly from the dashboard.
- Provide interview feedback and make hiring decisions.

### Job Seeker Dashboard:
- Receive meeting details and prep info directly from the employer.
- Track application status from VETTED to OFFER_SENT.

## Summary of Key Points

1. ✅ **Employer-Led**: Employers drive the pipeline, not admins.
2. ✅ **Manual Screening for All**: Both high-skill and low-skill jobs require employer review.
3. ✅ **Payment Gated**: Contact info is unlocked via payment.
4. ✅ **Proximity Focused**: Local matching is prioritized, especially for low-skill roles.