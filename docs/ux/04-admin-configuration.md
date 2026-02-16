# System Configuration (Admin)

## What It Does

Admins can adjust commission rates and fee limits **without code changes**. All values stored in database and applied immediately to new payments.

---

## Configurable Values

| Setting       | Range         | Default | What It Does                                   |
| ------------- | ------------- | ------- | ---------------------------------------------- |
| Commission %  | 10-20%        | 15%     | Base agency fee calculation                    |
| Floor Limit   | ₦1k - ₦10M    | ₦15k    | Minimum fee (protects revenue on low salaries) |
| Ceiling Limit | ₦100k - ₦100M | ₦1M     | Maximum fee (caps executive positions)         |
| VAT Rate      | 0-15%         | 7.5%    | Tax added to commission                        |

---

## How Changes Apply

**Existing Pending Payments**: Use OLD values (locked at creation)

**New Payments**: Use NEW values immediately

**Example:**

- Monday 9am: Rate is 15%, employer starts payment → Charged 15%
- Monday 10am: Admin changes to 17%
- Monday 11am: Different employer starts payment → Charged 17%
- Monday 12pm: First employer completes payment → Still pays 15%

---

## Configuration Flow

1. Admin opens Settings → Payment Configuration
2. Adjusts sliders/inputs
3. Preview shows example calculation
4. Clicks "Save Changes"
5. Backend validates inputs (e.g., floor < ceiling)
6. Saves to database
7. Logs change history (who, what, when)
8. Changes apply immediately to new payments

---

## Audit Trail

System automatically logs every configuration change:

- Previous value → New value
- Admin user who made change
- Timestamp
- Optional reason/note

Admins can view history and rollback to previous configurations if needed.

---

## Data Available

```
SystemConfig {
  key: 'EMPLOYEE_ACTIVATION_PERCENTAGE' | 'FLOOR' | 'CEILING' | 'VAT_RATE'
  value: string
  updatedAt: timestamp
  updatedBy: uuid (admin user)
}

ConfigHistory {
  configKey: string
  oldValue: string
  newValue: string
  changedBy: uuid
  changedAt: timestamp
  reason: string | null
}
```

---

## Validation Rules

- Commission: Must be 10-20%
- Floor: Must be less than ceiling
- Ceiling: Must be greater than floor
- VAT: Must be 0-15%
- Changes >5% may require confirmation modal (prevent accidental large changes)
