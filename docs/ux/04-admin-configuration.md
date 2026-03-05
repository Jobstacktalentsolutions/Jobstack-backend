# System Configuration (Admin)

## What It Does

Admins can adjust commission rates and fee limits **without code changes**. All values stored in the `system_configs` database table and applied immediately to new payments.

---

## Configurable Values

| Setting Key                                 | Default | Unit  | What It Does                                   |
| ------------------------------------------- | ------- | ----- | ---------------------------------------------- |
| `EMPLOYEE_ACTIVATION_PERCENTAGE`            | 0.15    | ratio | Base agency fee (15% = 0.15)                   |
| `EMPLOYEE_ACTIVATION_PERCENTAGE_FLOOR`      | 1500000 | kobo  | Minimum fee (₦15,000 = 1,500,000 kobo)         |
| `EMPLOYEE_ACTIVATION_PERCENTAGE_CEILING`    | 100000000 | kobo | Maximum fee (₦1,000,000 = 100,000,000 kobo)  |
| `EMPLOYEE_ACTIVATION_PERCENTAGE_VAT_RATE`   | 0.075   | ratio | VAT rate (7.5% = 0.075)                        |

---

## How Changes Apply

**Existing Pending Payments**: Use OLD values (rate locked when payment initiated)

**New Payments**: Use NEW values immediately

**Example:**

- Monday 9am: Rate is 15%, employer initiates payment → Charged 15%
- Monday 10am: Admin changes to 17%
- Monday 11am: Different employer initiates payment → Charged 17%
- Monday 12pm: First employer completes payment → Still pays 15% (locked at initiation)

---

## Validation Behaviour

The `SystemConfigService` enforces integrity on config values:

- If a required key is missing: throws `NotFoundException`
- If a numeric key has a non-numeric value: throws `BadRequestException`
- If NaN would reach commission calculations: `CommissionService` throws before any DB write

This means the system **never silently stores NaN amounts** — bad config is surfaced as a clear API error.

---

## Configuration API

```
GET    /system-config             — List all configs (admin only)
PATCH  /system-config/:key        — Update a config value (admin only)
```

---

## Audit Trail

Every `SystemConfig` row tracks:

- `key` — config key name
- `value` — stored as JSON string
- `updatedBy` — admin user UUID
- `updatedAt` — last modification timestamp
- `description` — human-readable description of the config

---

## Data Available

```
SystemConfig {
  key: SystemConfigKey
  value: string           // stored as JSON string (e.g., "0.15")
  description: string | null
  updatedBy: uuid | null  // admin user ID
  updatedAt: timestamp
}
```

Numeric keys validated on read: value is parsed with `Number()` and `NaN` results in a `BadRequestException`.
