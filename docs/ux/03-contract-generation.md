# Contract Generation & Digital Signatures

## What It Does

Auto-generates employment contracts as PDFs after payment confirmation. Both parties sign digitally, creating a legally binding document.

---

## How It Works

1. **Auto-Trigger**
   - Payment confirmed → Backend generates contract immediately
   - No manual action needed
   - Takes candidate data + job details → Creates PDF

2. **Contract Set Selection**
   - Employer selects which contracts apply to the role (one or more per hire),
   - Supported base contract types (EJS templates):
     - **Permanent Employment Contract** — full-time, indefinite
     - **Fixed-Term Employment Contract** — defined duration
     - **NDA (Non-Disclosure Agreement)** — confidential information
     - **Non-Compete Agreement** — post-employment competition restrictions
     - **IP Assignment Agreement** — IP created during employment assigned to employer
   - MVP: only these predefined templates; no admin add/edit of templates

3. **PDF Generation**
   - Backend merges EJS template with data (company name, salary, dates, etc.)
   - Renders HTML → PDF
   - Stores in secure storage (S3)
   - Sends link to both parties

4. **Signatures**
   - Both parties receive "Contract Ready" email
   - Order: Employer signs first, then Candidate signs
   - Each signature records: timestamp + IP address
   - Once both sign → Status: `FULLY_EXECUTED`

5. **Immutability**
   - Signed contracts cannot be edited
   - If changes needed, admin voids contract and generates new one

---

## Contract States

| Status                         | Meaning               | Who Can Sign 1    |
| ------------------------------ | --------------------- | ----------------- |
| `PENDING`                      | Being generated       | Nobody            |
| `AWAITING_EMPLOYER_SIGNATURE`  | Waiting for employer  | Employer only     |
| `AWAITING_CANDIDATE_SIGNATURE` | Waiting for candidate | Candidate only    |
| `FULLY_EXECUTED`               | Both signed           | Nobody (complete) |
| `VOIDED`                       | Cancelled/invalid     | Nobody            |

---

## Key Rules

- **Signing Order**: Employer → Candidate (enforced by backend)
- **Signature Data**: Each signature captured with timestamp + IP address
- **Immutability**: `FULLY_EXECUTED` contracts locked (no edits)
- **Void & Regenerate**: Only way to "edit" is void old + create new
- **Storage Security**: PDFs stored with signed URLs (expire after viewing)

---

## Data Available

```
Contract {
  status: enum
  employerSignedAt: timestamp | null
  employerSignatureIp: string | null
  candidateSignedAt: timestamp | null
  candidateSignatureIp: string | null
  pdfUrl: string (signed S3 URL)
  templateType: 'PERMANENT_EMPLOYMENT' | 'FIXED_TERM_EMPLOYMENT' | 'NDA' | 'NON_COMPETE' | 'IP_ASSIGNMENT'
  generatedAt: timestamp
}
```

Base contract types (MVP): predefined EJS templates only; no runtime template CRUD.

---

## Template Variables (EJS)

Backend injects these values into EJS contract templates:

- Company details (name, address, registration)
- Candidate details (name, address, ID)
- Job details (title, description, department)
- Compensation (salary/fee, benefits, payment schedule)
- Start date, duration (for fixed-term)
- Signature placeholders

Templates are EJS files; backend renders with data and produces HTML → PDF.
