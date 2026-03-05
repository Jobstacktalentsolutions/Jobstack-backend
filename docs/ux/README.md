# Selection & Gating System - UX Documentation

## Overview

This feature protects candidate contact information behind a payment. Employers must pay agency commission to unlock phone numbers and emails, ensuring serious hiring intent and platform revenue.

---

## The Complete Flow

```
1. ACCEPTANCE
   Employer accepts candidate → Candidate accepts offer
   Status: APPLICANT_ACCEPTED

2. PAYMENT
   Employer pays commission → Contact details unlock
   Status: PAYMENT_COMPLETE (set by Paystack webhook)

3. CONTRACT
   System generates employment contract → Both parties sign
   Status: CONTRACT_SIGNED (set when both sign)

4. HIRE
   Employer clicks "Confirm Hire" → Hire finalised
   Status: HIRED (set by explicit employer action)

5. CONFIGURATION (Admin)
   Admins adjust commission rates dynamically
```

---

## Application Status Progression

```
APPLIED
  → VETTED
    → SELECTED_FOR_SCREENING
      → SCREENING_COMPLETED
        → OFFER_SENT
          → APPLICANT_ACCEPTED
            → PAYMENT_COMPLETE      (payment webhook confirmed)
              → CONTRACT_SIGNED     (both parties signed contract)
                → HIRED             (employer explicitly confirms hire)
```

Terminal statuses (no further transitions): `HIRED`, `REJECTED`, `WITHDRAWN`

---

## Documentation Files

### [01-acceptance-flow.md](./01-acceptance-flow.md)

Two-step handshake where both parties must accept before payment. Explains application states and salary locking.

### [02-payment-gating.md](./02-payment-gating.md)

How contact masking works, commission calculation formula, payment flow, and unlock behavior.

### [03-contract-generation.md](./03-contract-generation.md)

Auto-generated PDF contracts with digital signatures. Template system and signature tracking.

### [04-admin-configuration.md](./04-admin-configuration.md)

Admin controls for commission rates, floor/ceiling limits, and configuration history.

---

## Key Concepts

**PII Gating**: Phone and email masked until payment complete (`piiUnlocked = true`)

- Before: `+234 ••• ••• •• 22` and `j•••••@gmail.com`
- After: Full contact details revealed

**Commission Calculation**: `(Salary × 12 × Percentage) + VAT`

- Floor: Minimum ₦15k (configurable)
- Ceiling: Maximum ₦1M (configurable)
- Rate: 15% base (admin configured)
- VAT: 7.5% (admin configured)

**Two-Step Acceptance**: Employer accepts → Candidate accepts → Payment required

- Prevents payment for candidates who reject offers
- Salary locks when employer accepts

**Auto-Generated Contracts**: Payment confirmed → Contract PDF created → Both parties sign

- Template selected by employment type (Permanent or Fixed-Term)
- Handlebars templates rendered to HTML → PDF via Puppeteer
- Signatures recorded with timestamp + IP address
- Immutable after both sign

**Explicit Final Hire**: Contract fully signed → Employer clicks "Confirm Hire" → `HIRED`

- `HIRED` is never set automatically
- Employer must deliberately complete the process after contract execution

---

## Common Scenarios

**Payment Failure**: Employer can retry, application stays in `APPLICANT_ACCEPTED`

**Rate Changes**: Admin updates rates → Only new payments affected (pending payments use original rate)

**Contract Signing Order**: Either party can sign; both required for `CONTRACT_SIGNED`

---

## Integration Checkpoints

- [x] Application status badges (all states)
- [x] Masked PII display components
- [x] Payment modal with real commission breakdown
- [x] Payment gateway redirection (Paystack)
- [x] Contract PDF generation
- [x] Digital signature flow (timestamp + IP)
- [x] Confirm Hire button at contract completion
- [x] Admin configuration interface

---

**Documentation Version**: 3.0
**Last Updated**: March 2026
**Backend**: Implemented ✅
**Frontend**: Implemented ✅
