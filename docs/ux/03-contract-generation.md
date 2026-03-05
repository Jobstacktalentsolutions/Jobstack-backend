# Contract Generation & Digital Signatures

## What It Does

Auto-generates employment contracts as PDFs after payment confirmation. Both parties sign digitally, and the employer explicitly confirms the hire after both sign.

---

## How It Works

1. **Auto-Trigger**
   - `employee-activation-payment.confirmed` event → Backend generates contract immediately
   - No manual action needed from the employer
   - Candidate data + job details → Handlebars template → HTML → PDF via Puppeteer

2. **Template Selection**
   - Template selected based on employment arrangement:
     - `PERMANENT_EMPLOYEE` → `PERMANENT_EMPLOYMENT` template
     - `CONTRACT` → `FIXED_TERM_CONTRACT` template
   - Templates are Handlebars `.hbs` files stored at `apps/api/src/templates/`
   - Templates are compiled and cached in memory after first load

3. **PDF Generation**
   - Backend renders Handlebars template with employee/employer/job data
   - HTML rendered to PDF by Puppeteer (headless Chrome)
   - PDF stored in private S3-compatible storage (Drive e2)
   - `Contract` entity created with `status = PENDING_SIGNATURES`

4. **Signatures**
   - Either party can sign (no enforced order)
   - Each signature records: timestamp + IP address
   - After employer signs alone: `status = EMPLOYER_SIGNED`
   - After employee signs alone: `status = EMPLOYEE_SIGNED`
   - After both sign: `status = FULLY_EXECUTED`, emits `contract.fully-executed` event

5. **Status Update on Full Execution**
   - `contract.fully-executed` event → `JobApplication.status = CONTRACT_SIGNED`

6. **Confirm Hire**
   - Employer sees "Confirm Hire" button when application is in `CONTRACT_SIGNED`
   - Clicking it calls `POST /job-applications/:applicationId/confirm-hire`
   - Sets `JobApplication.status = HIRED`

7. **Immutability**
   - `FULLY_EXECUTED` contracts cannot be edited
   - If changes needed, admin voids contract and generates new one

---

## Contract States

| Status               | Meaning                          | Next Action           |
| -------------------- | -------------------------------- | --------------------- |
| `PENDING_SIGNATURES` | Awaiting both parties to sign    | Either party signs    |
| `EMPLOYER_SIGNED`    | Employer signed; waiting for employee | Employee signs   |
| `EMPLOYEE_SIGNED`    | Employee signed; waiting for employer | Employer signs   |
| `FULLY_EXECUTED`     | Both signed; triggers CONTRACT_SIGNED on application | Employer confirms hire |
| `CANCELLED`          | Voided/cancelled                 | N/A                   |

---

## Key Rules

- **Signature Data**: Each signature captured with timestamp + IP address
- **Immutability**: `FULLY_EXECUTED` contracts locked (no edits)
- **Template Caching**: Templates compiled once and cached by template ID
- **Storage**: PDFs stored in private bucket; served via signed URLs

---

## Template Variables (Handlebars)

Backend injects these values into templates:

- `contractId` — Short display ID (e.g., `JOB-A1B2C3D4`)
- `issueDate` — Date contract was generated
- `employerName`, `employerAddress`, `employerEmail`
- `employeeName`, `employeeAddress`, `employeeEmail`, `employeePhone`
- `jobTitle`, `jobDescription`, `employmentType`, `employmentArrangement`, `workMode`
- `salary` (monthly), `annualSalary`, `contractFee`, `contractPaymentType`, `currency`
- `startDate`, `endDate`, `contractDuration`

Custom Handlebars helpers registered: `eq`, `formatDate`, `currency`

---

## Data Available

```
Contract {
  id: uuid
  employeeId: uuid
  templateId: uuid
  contractDocumentId: uuid          // stored PDF
  templateVersion: string
  status: ContractStatus
  employerSignedAt: timestamp | null
  employerSignatureIp: string | null
  employerSignedById: uuid | null
  employeeSignedAt: timestamp | null
  employeeSignatureIp: string | null
  employeeSignedById: uuid | null
  metadata: { generatedAt: string; templateData: object }
}
```
