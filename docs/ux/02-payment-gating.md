# Payment Gating & PII Masking

## What It Does

Contact information stays **masked** until employer pays agency commission. This protects candidates from spam and ensures platform revenue.

---

## Masking Rules

**Before Payment (`piiUnlocked = false`):**

- Phone: `+234 ••• ••• •• 22` (first 4 & last 2 visible)
- Email: `j•••••@gmail.com` (first char & domain visible)

**After Payment (`piiUnlocked = true`):**

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
For permanent employees:
  Annual Amount = Monthly Salary × 12

For contract employees:
  Annual Amount = Contract Fee (already project/duration-based)

Base Commission = Annual Amount × Percentage (default 15%, admin configured)
Apply Limits:
  - Minimum (floor): ₦15,000 (1,500,000 kobo, admin configured)
  - Maximum (ceiling): ₦1,000,000 (100,000,000 kobo, admin configured)
VAT = Applied Commission × 7.5% (admin configured)
Total = Applied Commission + VAT
```

**Example** (₦300k/month permanent at 15%):

- Annual: ₦3.6M
- Commission: ₦540k
- VAT: ₦40.5k
- **Total: ₦580.5k**

---

## Payment Flow

1. Candidate accepts offer → status `APPLICANT_ACCEPTED`
2. Employer sees payment breakdown with real commission figures (fetched from `/payment/employee/:employeeId/activation-breakdown`)
3. Employer clicks "Pay" → redirected to Paystack payment gateway
4. Completes payment on Paystack
5. Paystack sends webhook to backend (`/payment/webhook`)
6. Backend verifies Paystack signature and confirms payment
7. Backend sets `Employee.piiUnlocked = true`, `paymentStatus = PAID`
8. Backend sets `JobApplication.status = PAYMENT_COMPLETE`
9. Backend emits `employee-activation-payment.confirmed` event
10. Contract generation triggers automatically

---

## Payment States

| Application Status   | What Employer Sees                     |
| -------------------- | -------------------------------------- |
| `APPLICANT_ACCEPTED` | Masked PII + pay button with breakdown |
| `PAYMENT_COMPLETE`   | Full contact details, contract pending |
| `CONTRACT_SIGNED`    | Full contact details, confirm hire     |
| `HIRED`              | Full contact details, process complete |

---

## Important Behaviors

- **Rate Lock**: Commission snapshot stored on `Employee` when payment is initiated (admin changes don't affect pending payments)
- **Payment Retry**: If payment fails, employer can retry — application stays in `APPLICANT_ACCEPTED`
- **Webhook Security**: Backend verifies Paystack `X-Paystack-Signature` header before processing
- **Idempotency**: Duplicate webhooks ignored if payment already marked `SUCCESS`
- **Multiple Candidates**: Each payment unlocks one specific candidate only

---

## Data Available

```
Employee {
  piiUnlocked: boolean
  paymentStatus: 'NOT_REQUIRED' | 'PENDING' | 'PAID' | 'FAILED'
  activationPaymentId: uuid | null
}

CommissionBreakdown {
  baseAmount: number       // monthly salary or contract fee
  annualAmount: number     // baseAmount × 12 for permanent, baseAmount for contract
  percentage: number       // e.g. 0.15
  floor: number            // in kobo
  ceiling: number          // in kobo
  calculatedCommission: number
  appliedCommission: number // after floor/ceiling
  vatRate: number          // e.g. 0.075
  vatAmount: number
  totalAmount: number
  breakdown: string        // human-readable text
}
```
