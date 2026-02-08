## Plan: Selection & Gating Payment System

Implement a financial gating system that masks candidate PII until employers pay a configurable agency commission (10-20% of annual salary with floor/ceiling caps). The system integrates with existing Paystack infrastructure, adds a new `AWAITING_PAYMENT` status between OFFERED and HIRED, calculates fees with VAT/processing charges, and unmasks contact details upon payment confirmation. This mirrors the existing employee activation pattern but occurs earlier in the hiring flow.

**Key Decisions from Discovery:**

- Flow: SCREENING_COMPLETED → EMPLOYER ACCEPTS CANDIDATE -> APPLICANT ACCEPT OFFER → AWAITING_PAYMENT (gate here) → EMPLOYMENT AGREEMENT(Docs) -> HIRED
- Commission calculated on `Employee.salaryOffered` × 12 (annual basis)
- PII unmasked when `Employee.piiUnlocked = true` after payment
- Contract generation triggered post-payment via webhook event

---

**Steps**

### 1. Database Schema & Migrations

Create migration for new entities and status enums:

- Add `AWAITING_PAYMENT` to JobApplicationStatus enum
- Add `SELECTION_FEE` to PaymentType enum
- Extend Employee entity with `piiUnlocked: boolean` (default false), `selectionPaymentId: uuid` (nullable FK to Payment)
- Create `Contract` entity with fields: `id`, `employeeId`, `contractDocumentId` (FK to Document), `templateVersion`, `status` (PENDING_SIGNATURES, EMPLOYER_SIGNED, EMPLOYEE_SIGNED, FULLY_EXECUTED), `employerSignedAt`, `employeeSignedAt`, `ipAddressEmployer`, `ipAddressEmployee`, `createdAt`, `updatedAt`
- Seed SystemConfig table with new keys: `SELECTION_FEE_PERCENTAGE` (default: 0.15), `SELECTION_FEE_FLOOR` (15000 in kobo), `SELECTION_FEE_CEILING` (100000000 in kobo), `SELECTION_FEE_VAT_RATE` (0.075), `SELECTION_FEE_PROCESSING_RATE` (0.015)
- Run `npm run db:generate` and `npm run migration:run`

### 2. Commission Calculation Service

Create SelectionCommissionService:

- Inject `SystemConfigService` and `Logger`
- Method `calculateCommissionFee(salaryOffered: number, isContract: boolean): Promise<CommissionBreakdown>`
  - Fetch config values from SystemConfig
  - Calculate annual salary: `salaryOffered * (isContract ? 1 : 12)`
  - Apply formula: `baseCommission = annualSalary * percentage`
  - Apply bounds: `capped = Math.max(floor, Math.min(ceiling, baseCommission))`
  - Calculate VAT: `vat = capped * vatRate`
  - Calculate processing: `processing = capped * processingRate`
  - Return object: `{ baseAmount, floor, ceiling, vatAmount, processingFeeAmount, totalAmount, breakdown: string }`
- Method `generateInvoiceDescription(employeeName, jobTitle, totalAmount): string` - human-readable summary
- Unit tests validating floor/ceiling edge cases

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

- Method `initiateSelectionPayment(employeeId: uuid, initiatorId: uuid): Promise<{ paymentUrl, paymentReference }>`
  - Load Employee with relations (job, application, jobseekerProfile)
  - Validate: status must be ONBOARDING, piiUnlocked must be false, no existing PENDING selection payment
  - Calculate fee via `SelectionCommissionService.calculateCommissionFee()`
  - Create Payment record with type SELECTION_FEE, metadata storing employeeId and commission breakdown
  - Generate Paystack transaction via `PaystackService.initializeTransaction()`
  - Update Employee.selectionPaymentId
  - Return payment URL for employer redirection
- Method `processSelectionPaymentSuccess(paymentId: uuid): Promise<void>`
  - Called by webhook handler on `charge.success`
  - Load Payment and Employee
  - Update Payment status to SUCCESS, set paidAt timestamp
  - Set `Employee.piiUnlocked = true`, `Employee.paymentStatus = PAID`
  - Update associated JobApplication status to AWAITING_PAYMENT → (keep OFFERED status until contract signed)
  - Emit event `SelectionPaymentConfirmed` with employeeId
  - Send email notifications to employer and admin

### 5. Webhook Event Handling

Extend PaymentWebhookController:

- In `handleWebhook()`, add switch case for `PaymentType.SELECTION_FEE`
- Call `PaymentService.processSelectionPaymentSuccess(payment.id)`
- Existing signature verification and error handling applies

Create event listener in EmployeesService:

- Method decorated with `@OnEvent('selection-payment.confirmed')`
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

Create SelectionPaymentController:

- `POST /payment/selection/initiate/:employeeId` - Protected by EmployerJwtGuard, calls `PaymentService.initiateSelectionPayment()`
- `GET /payment/selection/status/:employeeId` - Returns payment status and PII unlock state
- `GET /employees/:id/contact` - Protected endpoint that returns unmasked PII only if authorized (mirrors existing pattern in EmployeesService)

Create ContractsController:

- `POST /contracts/:contractId/sign` - Protected, accepts signature data, calls `ContractService.signContract()`
- `GET /contracts/:contractId/download` - Protected, returns signed URL to contract PDF via StorageService

### 8. Email Notifications

Create EJS templates in apps/api/src/templates/emails/:

- `selection-payment-required.ejs` - Sent to employer after OFFERED status, includes Paystack link and commission breakdown
- `selection-payment-confirmed.ejs` - Sent to employer after successful payment, includes next steps (contract signing)
- `candidate-selected-notification.ejs` - Sent to candidate informing them employer is finalizing payment (no sensitive details)
- `contract-ready-for-signature.ejs` - Sent to both parties when contract is generated

Extend EmailService with corresponding methods

### 9. Admin Configuration UI Support

Extend SystemConfigController:

- Existing CRUD endpoints already support dynamic config updates
- Add admin UI calls to manage: `SELECTION_FEE_PERCENTAGE`, `SELECTION_FEE_FLOOR`, `SELECTION_FEE_CEILING`
- Values stored in database, updateable without deployment
- Frontend team needs to build admin panel UI (out of scope)

### 10. State Transition Guards

Update EmployeesService.updateEmployeeStatus():

- Add validation: Cannot transition Employee to ACTIVE unless `piiUnlocked === true`
- Add validation: Cannot delete/archive Employee if payment is PENDING
- Maintain existing payment checks for activation fee (separate from selection fee)

Update JobApplicationsService.updateApplicationStatus():

- Add validation: Cannot transition from OFFERED to HIRED without Employee.piiUnlocked check
- Ensure statusUpdatedAt timestamps are set on all transitions

---

**Verification**

1. **Unit Tests**: Jest tests for `SelectionCommissionService` covering floor/ceiling/VAT calculations, edge cases (zero salary, negative values)
2. **Integration Tests**: Test full payment flow with Paystack webhook simulation, verify status transitions and PII unlock
3. **E2E Test Scenario**:
   - Create application → Vet → Screen → Offer with salary ₦200,000/month
   - Verify commission = max(15k, min(1M, 200k _ 12 _ 0.15)) + VAT + processing
   - Initiate payment → Mock webhook → Verify `Employee.piiUnlocked = true`
   - Fetch employee contact → Verify unmasked phone/email returned
   - Generate contract → Verify PDF created and stored in S3
4. **Manual Testing**: Use Paystack test keys, confirm webhook signature validation, test payment failure scenarios
5. **Queries**: `SELECT * FROM employees WHERE piiUnlocked = false AND paymentStatus = 'PAID'` should return empty (data consistency check)

---

**Decisions**

- **Employee Creation Timing**: Employee record created at OFFERED stage (before payment) with `piiUnlocked = false`, allowing payment calculation and gating. Alternative was creating Employee only after payment, but this decouples offer acceptance from payment processing.
- **Annual vs Monthly Calculation**: Commission calculated on annual salary (monthly × 12) per user confirmation, ensures consistency across permanent and contract roles. Floor/ceiling applied to annual amount, not monthly.
- **Masking Strategy**: Service-level masking (not interceptor-based) to maintain consistency with existing JobseekerService privacy pattern. Interceptor approach would require request context injection for authorization checks.
- **Contract Library**: Chose Puppeteer over pdfkit for HTML-to-PDF generation to leverage existing EJS/Handlebars templating skills and enable rich formatting. Trade-off: heavier dependency (~300MB with Chromium), but better maintainability for non-technical contract template updates.
- **Signature Approach**: Simple timestamp + IP address storage (no third-party integration like DocuSign). Sufficient for MVP, can upgrade later if legal requirements necessitate cryptographic signatures.
- **Separate Payment Types**: Using `PaymentType.SELECTION_FEE` vs existing `ACTIVATION` to separate billing concerns. Selection fee is per-hire agency commission; activation fee (if different) remains for account setup. User requirements suggest they might be the same—clarify if consolidation needed.
