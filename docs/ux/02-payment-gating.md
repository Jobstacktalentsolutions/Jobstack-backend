# Payment Gating & PII Masking

## What It Does

Contact information stays **masked** until employer pays agency commission. This protects candidates from spam and ensures platform revenue.

---

## Masking Rules

**Before Payment:**

- Phone: `+234 ••• ••• •• 22` (first 4 & last 2 visible)
- Email: `j•••••@gmail.com` (first char & domain visible)

**After Payment:**

- Phone: `+234 803 123 45 22` (full number)
- Email: `john.doe@gmail.com` (full email)

**Who Sees What:**

- Candidates: Always see their own full details
- Employers (unpaid): Masked
- Employers (paid): Full
- Admins: Always full

---

## Commission Calculation

```
Annual Salary = Monthly Salary × 12
Base Commission = Annual Salary × Percentage (10-20%, admin configured)
Apply Limits:
  - Minimum (floor): ₦15,000
  - Maximum (ceiling): ₦1,000,000
Add VAT = Commission × 7.5%
Total = Commission + VAT
```

**Example** (₦300k/month at 15%):

- Annual: ₦3.6M
- Commission: ₦540k
- VAT: ₦40.5k
- **Total: ₦580.5k**

---

## Payment Flow

1. Candidate accepts offer
2. Employer sees payment breakdown with "Pay Now" button
3. Redirected to Paystack payment gateway
4. Completes payment
5. Paystack webhook confirms payment to backend
6. Backend unlocks PII immediately
7. Both parties receive email with full contact details
8. Contract generation begins automatically

---

## Payment States

| State            | Application Status   | What Employer Sees         |
| ---------------- | -------------------- | -------------------------- |
| Locked           | Before acceptance    | Masked PII, no payment yet |
| Payment Required | `APPLICANT_ACCEPTED` | Masked + pay button        |
| Processing       | `APPLICANT_ACCEPTED` | Masked + "processing..."   |
| Unlocked         | `ACTIVATED`          | Full contact details       |

---

## Important Behaviors

- **Rate Lock**: Commission locks when payment initiated (admin changes don't affect pending payments)
- **Payment Retry**: If payment fails, employer can retry with new payment link
- **Webhook Security**: Backend verifies Paystack signatures before unlocking
- **Idempotency**: Duplicate webhooks ignored (no double-processing)
- **Multiple Candidates**: Each payment unlocks one specific candidate only

---

## Data Available

```
Employee {
  piiUnlocked: boolean
  phoneNumber: string (masked or full based on unlock)
  email: string (masked or full based on unlock)
  activationPaymentId: uuid | null
}

Payment {
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
  amount: number (total in kobo)
  breakdown: {
    annualSalary: number
    commissionPercentage: number
    commissionAmount: number
    vatAmount: number
    total: number
  }
}
```
