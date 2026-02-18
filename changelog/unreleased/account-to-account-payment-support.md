## Account-to-account payment support

Added `dev.acp.account_to_account` payment handler for push-based bank transfer payments.

### Changes

- Added `BankInstructions` schema: destination account details (IBAN/local account, BIC, bank name, payment reference, expiry) returned by the merchant when a checkout is completed with a push payment handler.
- Added `BankTransferConfirmation` schema: settlement status tracking (`pending`, `received`, `expired`, `failed`) with `received_at` timestamp.
- Added `bank_instructions` and `bank_transfer_confirmation` as optional fields on the `Order` schema for account-to-account orders.
- Updated `PaymentData.anyOf` to allow handler-only references (no instrument) for push payment handlers.
- Updated `completeCheckoutSession` endpoint documentation to describe the push payment flow (`complete_in_progress` status with bank instructions returned in order).
- Added account-to-account examples for checkout completion, webhook `order_create`, and webhook `order_update` (settlement confirmed).

### Backward Compatibility

Additive only; no breaking schema changes. Existing implementations ignore unknown handlers and optional Order fields.

### Files Updated

- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `spec/unreleased/openapi/openapi.agentic_checkout_webhook.yaml`
- `examples/unreleased/examples.agentic_checkout.json`
- `rfcs/rfc.agentic_checkout.md`
- `rfcs/rfc.delegate_payment.md`
