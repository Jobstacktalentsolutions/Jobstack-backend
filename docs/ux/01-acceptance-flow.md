# Job Application Acceptance Flow

## What It Does

A **two-step mutual agreement** system where both employer and candidate must explicitly accept before payment is required. This prevents wasted payments on candidates who would reject offers.

---

## The Flow

1. **Employer Accepts Candidate**
   - Employer reviews application and clicks "Send Offer"
   - An `Employee` record is created; salary value locks
   - Candidate receives notification with offer details
   - Status: `OFFER_SENT`

2. **Candidate Responds**
   - Sees salary, job details, company info
   - Chooses: Accept or Decline
   - Has 7 days to respond (offer expires after)

3. **If Candidate Accepts**
   - Status changes to `APPLICANT_ACCEPTED`
   - Payment modal appears for employer with commission breakdown
   - Candidate waits for employer payment
   - Contact info stays masked until payment complete

4. **If Candidate Declines**
   - Status: `REJECTED`
   - Process ends, employer can select a different candidate

---

## Application States

| Status                   | What It Means                          | Next Step                   |
| ------------------------ | -------------------------------------- | --------------------------- |
| `APPLIED`                | Application submitted                  | Admin vetting               |
| `VETTED`                 | Vetting score assigned                 | Admin selects for screening |
| `SELECTED_FOR_SCREENING` | Invited to screening                   | Screening scheduled         |
| `SELECTED_FOR_HIRE`      | Screening done                         | Employer reviews            |
| `OFFER_SENT`             | Employer sent offer; awaiting response | Candidate accepts/declines  |
| `APPLICANT_ACCEPTED`     | Candidate agreed                       | Employer pays commission    |
| `PAYMENT_COMPLETE`       | Payment confirmed, PII unlocked        | Contract generated & signed |
| `CONTRACT_SIGNED`        | Both parties signed the contract       | Employer confirms hire      |
| `HIRED`                  | Final hire confirmed by employer       | Process complete            |
| `REJECTED`               | Someone rejected                       | Process ends                |
| `WITHDRAWN`              | Candidate withdrew                     | Process ends                |

---

## Key Rules

- **Salary Locks**: Value freezes when employer sends offer (no renegotiation after)
- **One Active Job**: Once candidate accepts one offer, all their other applications auto-decline
- **Offer Expires**: Candidate has 7 days to respond
- **Terminal States**: Applications in `PAYMENT_COMPLETE`, `CONTRACT_SIGNED`, `HIRED`, `REJECTED`, or `WITHDRAWN` cannot be withdrawn
- **Explicit Hire**: `HIRED` is only set when the employer explicitly clicks "Confirm Hire" — never set automatically

---

## Data Available

```
JobApplication {
  status: JobApplicationStatus
  statusUpdatedAt: timestamp
}

Employee {
  salaryOffered: decimal (monthly, locked at offer)
  piiUnlocked: boolean (set true after payment)
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
}
```
