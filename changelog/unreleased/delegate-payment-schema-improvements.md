# Unreleased Changes

## Delegate Payment Schema — RFC Alignment & E‑commerce Platform Improvements

Improvements to `schema.delegate_payment.json` for RFC alignment and better interoperability.

### RFC alignment

- **PaymentMethodCard.virtual**: Added `virtual` to `required` array (RFC §3.3 marks it REQUIRED).
- **Error.code**: Added `unsupported_api_version` and `missing_api_version` to the enum for version-related errors (see `add-supported-versions-field.md`).

### E‑commerce platform alignment

- **Address**: Added optional `email` (format: email, maxLength: 256) and `phone` (maxLength: 32) for receipts, 3DS, and fraud.
- **DelegatePaymentResponse**: Added optional `expires_at` (date-time) echoing allowance expiry for merchant convenience.

### Additional changes (follow-up)

- **RFC** (`rfcs/rfc.delegate_payment.md`): Documented optional Address `email`/`phone`, response `expires_at`, optional Allowance `order_id`; changelog entry.
- **Allowance**: Optional `order_id` added to schema and RFC for merchant order correlation.
- **Agentic checkout**: Shared `Address` in `schema.agentic_checkout.json` aligned with delegate_payment: same optional `email`/`phone`, `maxLength`.

### Files

- `spec/unreleased/json-schema/schema.delegate_payment.json`
- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `rfcs/rfc.delegate_payment.md`

### Backward compatibility

- New Address fields (`email`, `phone`) are optional.
- New Response field (`expires_at`) is optional.
- Stricter validation (virtual required) may reject previously accepted payloads; ensure clients send RFC-compliant values.
