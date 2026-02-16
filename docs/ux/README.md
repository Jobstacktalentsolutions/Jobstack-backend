# Selection & Gating System - UX Documentation

## Overview

This feature protects candidate contact information behind a payment. Employers must pay agency commission to unlock phone numbers and emails, ensuring serious hiring intent and platform revenue.

---

## The Complete Flow

```
1. ACCEPTANCE
   Employer accepts candidate → Candidate accepts offer

2. PAYMENT
   Employer pays commission → Contact details unlock

3. CONTRACT
   System generates employment contract → Both parties sign

4. CONFIGURATION (Admin)
   Admins adjust commission rates dynamically
```

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

**PII Gating**: Phone and email masked until payment complete

- Before: `+234 ••• ••• •• 22` and `j•••••@gmail.com`
- After: Full contactdetails revealed

**Commission Calculation**: `(Salary × 12 × Percentage) + VAT`

- Floor: Minimum ₦15k
- Ceiling: Maximum ₦1M
- Rate: 10-20% (admin configured)

**Two-Step Acceptance**: Employer accepts → Candidate accepts → Payment required

- Prevents payment for candidates who reject offers
- Salary locks when employer accepts

**Auto-Generated Contracts**: Payment confirmed → Contract PDF created → Both parties sign

- Template selected by employment type
- Signatures recorded with timestamp + IP
- Immutable after both sign

---

## Common Scenarios

**Multiple Offers**: Candidate accepts one → All others auto-decline

**Payment Failure**: Employer can retry, application stays in "payment required" state

**Offer Expiration**: Candidate has 7 days to respond, then offer expires

**Rate Changes**: Admin updates rates → Only new payments affected (pending payments use original rate)

**Contract Edits**: Cannot edit signed contracts, must void and regenerate

---

## For Designers

Focus on these user journeys:

1. **Employer views application** → Sees masked contact → Accepts candidate → Waits for candidate response → Sees payment modal → Completes payment → Sees full contact details

2. **Candidate receives offer** → Reviews salary/terms → Accepts → Waits for payment → Receives "payment complete" notification → Signs contract

3. **Admin adjusts rates** → Views current config → Changes percentage → Sees preview calculation → Saves → Views change history

Design for these key states: Pending, Accepted, Payment Required, Processing, Unlocked, Contract Ready, Signed.

---

## For Product Managers

**Business Rules:**

- Payment locks contact details until confirmed
- Both parties must accept before payment required
- Commission rates configurable by admin (no code deployment)
- Contracts legally binding with timestamp + IP tracking
- Single active job per candidate (accepting one declines others)

**Edge Cases Handled:**

- Payment retry logic for failures
- Offer expiration after 7 days
- Configuration lock-in (rate changes don't affect pending payments)
- Webhook idempotency (duplicate payment confirmations ignored)
- Contract immutability (must void + regenerate to "edit")

---

## Integration Checkpoints

- [ ] Application status badges (5 states)
- [ ] Masked PII display components
- [ ] Payment modal with breakdown
- [ ] Payment gateway redirection (Paystack)
- [ ] Contract PDF viewer
- [ ] Digital signature flow
- [ ] Admin configuration interface
- [ ] Real-time status updates (webhooks or polling)

---

**Documentation Version**: 2.0 (Concise)  
**Last Updated**: February 2026  
**Backend**: Implemented ✅  
**Frontend**: Pending
