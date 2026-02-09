## Plan: Selection & Gating Payment System

Implement a financial gating system that masks candidate PII until employers pay a configurable agency commission (10-20% of annual salary with floor/ceiling caps). The system integrates with existing Paystack infrastructure, adds a new `AWAITING_PAYMENT` status between OFFERED and HIRED, calculates fees with VAT, and unmasks contact details upon payment confirmation.

**Key Decisions from Discovery:**

- Flow: SCREENING_COMPLETED → EMPLOYER_ACCEPTS_CANDIDATE -> APPLICANT_ACCEPTS_OFFER → AWAITING_PAYMENT (gate here) → EMPLOYMENT_AGREEMENT(Docs) -> HIRED
- Commission calculated on `Employee.salaryOffered` × 12 (annual basis) for permanent roles, or `Employee.contractFeeOffered` for contracts
- **Salary/Contract Fee determined at Job creation**, not during acceptance (Job.salary and Job.contractFee fields)
- PII unmasked when `Employee.piiUnlocked = true` after payment
- Contract generation triggered post-payment via webhook event
- **Payment field**: `Employee.activationPaymentId` (old `paymentId` deprecated)
- **Payment type**: `PaymentType.EMPLOYEE_ACTIVATION_FEE` (new system with floor/ceiling/VAT)

---

## ✅ Completed: Job Salary Simplification & Acceptance Flow (Phase 1)

### Changes Implemented

**1. Job Entity Simplification**

- **Removed**: `salaryMin`, `salaryMax`, `contractFeeMin`, `contractFeeMax` fields
- **Added**: Single `salary` and `contractFee` fields (decimal 12,2)
- **Rationale**: Salary negotiation happens at job posting, not during candidate acceptance

**2. DTOs Updated**

- `CreateJobDto` and `UpdateJobDto` now accept single `salary` and `contractFee` values
- `EmployerAcceptCandidateDto` simplified to only accept `startDate` and `notes`
- Removed salary/contractFee/currency from acceptance flow

**3. Service Layer Changes**

- `JobsService`: Removed `assertSalaryRange()` validation
- `employerAcceptCandidate()`: Now pulls salary/contractFee directly from `Job` entity
- Validates that job has salary/contractFee defined before allowing acceptance
- Employee record created with values from job posting, not from acceptance request

**4. Database Impact**

- Migration needed to:
  - Drop columns: `salaryMin`, `salaryMax`, `contractFeeMin`, `contractFeeMax`
  - Add columns: `salary`, `contractFee` (both nullable decimal)
  - Data migration: If existing jobs have ranges, could use midpoint or max value

### API Changes

**Before:**

```typescript
POST /job-applications/:id/employer-accept
Body: {
  salary: 200000,
  contractFee: 50000,
  currency: "NGN",
  startDate: "2026-03-01",
  notes: "Welcome aboard!"
}
```

**After:**

```typescript
POST /job-applications/:id/employer-accept
Body: {
  startDate: "2026-03-01",
  notes: "Welcome aboard!"
}
// Salary/contractFee comes from the Job entity
```

---

**Steps**

### 1. Database Schema & Migrations

Create migration for new entities and status enums:

- ✅ Add `AWAITING_PAYMENT` to JobApplicationStatus enum
- ✅ Add `EMPLOYEE_ACTIVATION_FEE` to PaymentType enum (agency commission with floor/ceiling/VAT for both permanent and contract employees)
- ✅ Extend Employee entity:
  - `piiUnlocked: boolean` (default false) - gates PII until payment
  - `activationPaymentId: uuid` (nullable FK to Payment)
- ✅ Seed SystemConfig table with new keys:
  - `EMPLOYEE_ACTIVATION_PERCENTAGE` (default: 0.15 = 15%)
  - `EMPLOYEE_ACTIVATION_PERCENTAGE_FLOOR` (1,500,000 kobo = ₦15,000)
  - `EMPLOYEE_ACTIVATION_PERCENTAGE_CEILING` (100,000,000 kobo = ₦1,000,000)
  - `EMPLOYEE_ACTIVATION_PERCENTAGE_VAT_RATE` (0.075 = 7.5%)
- ✅ Update Job entity: Remove min/max salary fields, add single `salary` and `contractFee` fields
- Run `npm run db:generate` and `npm run migration:run`

### 2. Commission Calculation Service

Create EmployeeActivationCommissionService:

- Inject `SystemConfigService` and `Logger`
- Method `calculateCommissionFee(salaryOffered: number, isContract: boolean): Promise<CommissionBreakdown>`
  - Fetch config values from SystemConfig:
    - `EMPLOYEE_ACTIVATION_PERCENTAGE`
    - `EMPLOYEE_ACTIVATION_PERCENTAGE_FLOOR`
    - `EMPLOYEE_ACTIVATION_PERCENTAGE_CEILING`
    - `EMPLOYEE_ACTIVATION_PERCENTAGE_VAT_RATE`
  - Calculate annual salary: `salaryOffered * (isContract ? 1 : 12)` (contracts are already annual/project-based)
  - Apply formula: `baseCommission = annualSalary * percentage`
  - Apply bounds: `capped = Math.max(floor, Math.min(ceiling, baseCommission))`
  - Calculate VAT: `vat = capped * vatRate`
  - **No processing fee** - Paystack deducts transaction fees automatically
  - Return object: `{ baseAmount, floor, ceiling, appliedAmount, vatAmount, totalAmount, breakdown: string }`
- Method `generateInvoiceDescription(employeeName, jobTitle, totalAmount): string` - human-readable summary
- Unit tests validating floor/ceiling edge cases

**Calculation Example:**

```
Salary: ₦300,000/month
Annual: ₦3,600,000
Base Commission (15%): ₦540,000
Applied (within floor/ceiling): ₦540,000
VAT (7.5%): ₦40,500
Total Due: ₦580,500
```

### 3. PII Masking Logic

Create PiiMaskingService:

- Method `maskPhoneNumber(phone: string): string` - returns `"0803 **** 55"` format (show first 4, last 2)
- Method `maskEmail(email: string): string` - returns `"j***@example.com"` format (show first char, domain)
- Method `shouldUnmaskForUser(employee: Employee, currentUser: CurrentUser): boolean`
  - Return true if: user is admin OR (user is employer AND `employee.piiUnlocked === true`) OR user is the jobseeker
- Apply masking in EmployeesService.findOne() based on authorization check
- Also apply in JobApplicationsService when returning application with nested jobseeker profile

### 4. Selection Payment Flow

Extend PaymentService:

- Method `initiateActivationPayment(employeeId: uuid, initiatorId: uuid): Promise<{ paymentUrl, paymentReference }>`
  - Load Employee with relations (job, application, jobseekerProfile)
  - Validate: status must be ONBOARDING, piiUnlocked must be false, no existing PENDING activation payment
  - Calculate fee via `EmployeeActivationCommissionService.calculateCommissionFee()`
  - Create Payment record with type EMPLOYEE_ACTIVATION_FEE, metadata storing employeeId and commission breakdown
  - Generate Paystack transaction via `PaystackService.initializeTransaction()`
  - Update Employee.activationPaymentId
  - Return payment URL for employer redirection
- Method `processActivationPaymentSuccess(paymentId: uuid): Promise<void>`
  - Called by webhook handler on `charge.success`
  - Load Payment and Employee
  - Update Payment status to SUCCESS, set paidAt timestamp
  - Set `Employee.piiUnlocked = true`, `Employee.paymentStatus = PAID`
  - Update associated JobApplication status to APPLICANT_ACCEPTED → AWAITING_PAYMENT
  - Emit event `EmployeeActivationPaymentConfirmed` with employeeId
  - Send email notifications to employer and admin

### 5. Webhook Event Handling

Extend PaymentWebhookController:

- In `handleWebhook()`, add switch case for `PaymentType.EMPLOYEE_ACTIVATION_FEE`
- Call `PaymentService.processActivationPaymentSuccess(payment.id)`
- Existing signature verification and error handling applies

Create event listener in EmployeesService:

- Method decorated with `@OnEvent('employee-activation-payment.confirmed')`
- Trigger `ContractService.generateEmploymentContract(employeeId)` (see step 6)

### 6. Contract Generation (Foundation)

Create ContractService and ContractsModule:

- Install dependency: `npm install handlebars` (mirrors email template pattern with EJS)
- Create contract template file employment-contract.hbs with placeholders: `{{employerName}}`, `{{employeeName}}`, `{{jobTitle}}`, `{{salary}}`, `{{startDate}}`, `{{contractId}}`
- Method `generateEmploymentContract(employeeId: uuid): Promise<Contract>`
  - Load Employee with all relations (employerProfile, jobseekerProfile, job, payment)
  - Compile Handlebars template with data
  - Use Puppeteer to generate PDF from HTML (`npm install puppeteer`)
  - Upload PDF to S3 via `StorageService.uploadBuffer()`
  - Create Document record
  - Create Contract record with status PENDING_SIGNATURES, link to Document
  - Return Contract entity
- Method `signContract(contractId: uuid, userId: uuid, userType: 'employer' | 'employee', ipAddress: string): Promise<Contract>`
  - Update appropriate signature fields and timestamp
  - If both signed, update status to FULLY_EXECUTED, update JobApplication status to HIRED
- Signature UI is frontend responsibility (out of scope for backend plan)

### 7. API Endpoints

Create EmployeeActivationPaymentController:

- `POST /payment/employee-activation/initiate/:employeeId` - Protected by EmployerJwtGuard, calls `PaymentService.initiateActivationPayment()`
- `GET /payment/employee-activation/status/:employeeId` - Returns payment status and PII unlock state
- `GET /employees/:id/contact` - Protected endpoint that returns unmasked PII only if authorized (mirrors existing pattern in EmployeesService)

Create ContractsController:

- `POST /contracts/:contractId/sign` - Protected, accepts signature data, calls `ContractService.signContract()`
- `GET /contracts/:contractId/download` - Protected, returns signed URL to contract PDF via StorageService

### 8. Email Notifications

Create EJS templates in apps/api/src/templates/emails/:

- `employee-activation-payment-required.ejs` - Sent to employer after candidate accepts offer, includes Paystack link and commission breakdown
- `employee-activation-payment-confirmed.ejs` - Sent to employer after successful payment, includes next steps (contract signing)
- `candidate-offer-accepted-notification.ejs` - Sent to candidate informing them employer is finalizing payment (no sensitive details)
- `contract-ready-for-signature.ejs` - Sent to both parties when contract is generated

Extend EmailService with corresponding methods

### 9. Admin Configuration UI Support

Extend SystemConfigController:

- Existing CRUD endpoints already support dynamic config updates
- Add admin UI calls to manage:
  - `EMPLOYEE_ACTIVATION_PERCENTAGE`
  - `EMPLOYEE_ACTIVATION_PERCENTAGE_FLOOR`
  - `EMPLOYEE_ACTIVATION_PERCENTAGE_CEILING`
  - `EMPLOYEE_ACTIVATION_PERCENTAGE_VAT_RATE`
- Values stored in database, updateable without deployment
- Frontend team needs to build admin panel UI (out of scope)

### 10. State Transition Guards

Update EmployeesService.updateEmployeeStatus():

- Add validation: Cannot transition Employee to ACTIVE unless `piiUnlocked === true`
- Add validation: Cannot delete/archive Employee if payment is PENDING

Update JobApplicationsService.updateApplicationStatus():

- Add validation: Cannot transition from APPLICANT_ACCEPTED to HIRED without Employee.piiUnlocked check
- Ensure statusUpdatedAt timestamps are set on all transitions

---

**Verification**

1. **Unit Tests**: Jest tests for `EmployeeActivationCommissionService` covering floor/ceiling/VAT calculations, edge cases (zero salary, negative values, boundary conditions)
2. **Integration Tests**: Test full payment flow with Paystack webhook simulation, verify status transitions and PII unlock
3. **E2E Test Scenario**:
   - Create application → Vet → Screen → Employer Accept → Applicant Accept with salary ₦200,000/month
   - Calculate commission: Annual = ₦2,400,000, Base (15%) = ₦360,000, VAT (7.5%) = ₦27,000, Total = ₦387,000
   - Verify commission within floor (₦15,000) and ceiling (₦1,000,000)
   - Initiate payment → Mock Paystack webhook → Verify `Employee.piiUnlocked = true`
   - Fetch employee contact → Verify unmasked phone/email returned
   - Generate contract → Verify PDF created and stored in S3
4. **Manual Testing**: Use Paystack test keys, confirm webhook signature validation, test payment failure scenarios
5. **Data Integrity Queries**:
   - `SELECT * FROM employees WHERE piiUnlocked = false AND paymentStatus = 'PAID'` should return empty
   - `SELECT * FROM payments WHERE type = 'EMPLOYEE_ACTIVATION_FEE' AND status = 'SUCCESS' AND paidAt IS NULL` should return empty

**Decisions**

- **Employee Creation Timing**: Employee record created at EMPLOYER_ACCEPTED stage (before payment) with `piiUnlocked = false`, allowing payment calculation and gating. Alternative was creating Employee only after payment, but this decouples offer acceptance from payment processing.
- **Salary at Job Level**: Salary/ContractFee defined when job is created (Job.salary, Job.contractFee), not negotiated during candidate acceptance. Simplifies flow and ensures transparency.
- **Annual vs Monthly Calculation**: Commission calculated on annual salary (monthly × 12) for permanent employees. Contract fees are already project/duration-based. Floor/ceiling applied to annual amount.
- **VAT Inclusion**: 7.5% VAT added to commission fee per Nigerian tax law. Displayed separately in payment breakdown for transparency.
- **No Processing Fee Config**: Paystack automatically deducts transaction fees (1.5% + ₦100 capped at ₦2000). No need to configure separately.
- **Masking Strategy**: Service-level masking (not interceptor-based) to maintain consistency with existing JobseekerService privacy pattern. Interceptor approach would require request context injection for authorization checks.
- **Contract Library**: Chose Puppeteer over pdfkit for HTML-to-PDF generation to leverage existing EJS/Handlebars templating skills and enable rich formatting. Trade-off: heavier dependency (~300MB with Chromium), but better maintainability for non-technical contract template updates.
- **Signature Approach**: Simple timestamp + IP address storage (no third-party integration like DocuSign). Sufficient for MVP, can upgrade later if legal requirements necessitate cryptographic signatures.
- **Payment Type Naming**: Using `PaymentType.EMPLOYEE_ACTIVATION_FEE` for consistency. Config keys use `EMPLOYEE_ACTIVATION_PERCENTAGE` for clarity.
- **Legacy Fields**: Old `paymentId` field marked as deprecated but kept for backward compatibility. New system uses `activationPaymentId`.
