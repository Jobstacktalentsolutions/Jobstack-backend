# Payment Module

## Purpose

The Payment module handles the financial transactions required for employee activation in the JobStack platform. It enforces the business rule that employers must pay a configurable percentage (default 10%) upfront before employees can be activated from ONBOARDING to ACTIVE status.

## Flow

### Employee Activation Payment Flow

1. **Employee Creation**: Employer creates an employee record with status ONBOARDING
2. **Activation Attempt**: Employer tries to change employee status to ACTIVE
3. **Payment Check**: System checks if payment is required and completed
4. **Payment Initiation**: If payment required, employer initiates payment via Paystack
5. **Payment Processing**: Paystack processes the payment and sends webhook
6. **Status Update**: Upon successful payment, employee can be activated

### Payment Calculation

- **Permanent Employees**: 10% of `salaryOffered`
- **Contract Employees**: 10% of `contractFeeOffered`
- **Percentage**: Configurable by admin via SystemConfig

### Architecture Components

#### Services
- **PaymentService**: Core business logic for payment processing
- **PaystackService**: Integration with Paystack payment gateway
- **SystemConfigService**: Management of admin-configurable settings

#### Controllers
- **PaymentController**: Employer-facing payment endpoints
- **PaymentWebhookController**: Handles Paystack webhook events
- **PaymentAdminController**: Admin management of payments and configuration

#### Entities
- **Payment**: Stores payment transaction records
- **SystemConfig**: Stores admin-configurable settings
- **Employee**: Extended with payment-related fields

## Key Features

1. **Payment Validation**: Prevents employee activation without required payment
2. **Flexible Calculation**: Different calculation for permanent vs contract employees
3. **Admin Configuration**: Configurable payment percentage
4. **Webhook Processing**: Real-time payment status updates
5. **Payment History**: Complete audit trail of all transactions
6. **Security**: Webhook signature verification and proper error handling

## Security Considerations

- Paystack webhook signature verification
- Admin-only access to system configuration
- Employer scoped access to payments
- Server-side payment validation before status changes
- Secure storage of payment data

## Integration Points

- **Employee Service**: Payment validation before status changes
- **Paystack API**: Payment processing and verification
- **Admin System**: Configuration management
- **Frontend**: Payment initiation and status display
