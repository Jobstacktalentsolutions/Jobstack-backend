# Job Application Acceptance Flow

## What It Does

A **two-step mutual agreement** system where both employer and candidate must explicitly accept before payment is required. This prevents wasted payments on candidates who would reject offers.

---

## The Flow

1. **Employer Accepts Candidate**
   - Employer reviews application and clicks "Accept"
   - Salary value locks (captured from job posting)
   - Candidate receives notification with offer details
   - Status: `EMPLOYER_ACCEPTED`

2. **Candidate Responds**
   - Sees salary, job details, company info
   - Chooses: Accept or Decline
   - Has 7 days to respond (offer expires after)

3. **If Candidate Accepts**
   - Status changes to `APPLICANT_ACCEPTED`
   - Payment modal appears for employer
   - Candidate waits for employer payment
   - Contact info stays masked until payment complete

4. **If Candidate Declines**
   - Status: `DECLINED`
   - Process ends, employer can select different candidate

---

## Application States

| Status               | What It Means          | Next Step                  |
| -------------------- | ---------------------- | -------------------------- |
| `PENDING`            | Application submitted  | Employer reviews           |
| `EMPLOYER_ACCEPTED`  | Employer wants to hire | Candidate accepts/declines |
| `APPLICANT_ACCEPTED` | Candidate agreed       | Employer pays              |
| `ACTIVATED`          | Payment complete       | Contract signatures        |
| `DECLINED`           | Someone rejected       | Process ends               |

---

## Key Rules

- **Salary Locks**: Value freezes when employer accepts (no renegotiation)
- **One Active Job**: Once candidate accepts one offer, all their other applications auto-decline
- **Offer Expires**:候Candidate has 7 days to respond
- **Payment Timeout**: Candidate can withdraw if employer doesn't pay within 48 hours
- **Employer Can Withdraw**: Employer can retract offer after accepting (sets to `DECLINED`)

---

## Data Available

```
Application {
  status: enum
  employerAcceptedAt: timestamp | null
  applicantAcceptedAt: timestamp | null
  salaryOffered: number (monthly, locked value)
  offerExpiresAt: timestamp (7 days after employer accepts)
}
```
