## Add UPI Circle Delegated Payment Handler

This change adds support for UPI Circle (NPCI's delegated payment system) as a delegated payment handler for the Agentic Commerce Protocol (ACP). This enables agent-initiated UPI payments within pre-authorized mandates for the Indian market.

### Problem Statement

ACP's Instant Checkout supports delegated payment via Single-use Payment Tokens (SPT) from major payment processors, but no equivalent exists for India — 600M+ active UPI users, $2.6T annual transaction volume. Indian merchants must fall back to browser redirect for every transaction, even when users have expressed purchase intent in-chat.

### Solution: UPI Circle

UPI Circle (launched by NPCI in 2024) allows a primary UPI account holder to grant an AI agent pre-authorized spending power within defined limits (amount ceiling, merchant category, expiry). Once the mandate is set up, the agent executes payments autonomously without prompting for UPI PIN on each transaction.

### Key Features

- **Agent-Initiated Payments**: Execute UPI debits without real-time user PIN entry (within mandate limits)
- **Pre-Authorized Mandates**: User grants spending authority once, reuses for multiple purchases
- **Credential-before-Checkout**: Platform fetches a one-time `delegated_payment_credential` (with `provider` discriminator) from the PSP's TSP per transaction before submitting Complete Checkout — no per-transaction buyer interaction required
- **India Market Coverage**: Supports 600M+ UPI users via NPCI infrastructure
- **ACP Compatible**: Works with existing ACP `complete_checkout_session` MCP tool via the `delegate_payment` endpoint

### Handler Details

- **Handler Name**: `dev.acp.upi_circle` — PSP identity is declared in the handler's `psp` field (e.g., `"razorpay"`), not in the handler name
- **Version**: `2026-04-07`
- **ACP Version**: `2025-09` (GA) and later
- **Currency Support**: INR only
- **Checkout Type**: `instant` (delegated payment)
- **Maximum Transaction**: ₹15,000 (NPCI UPI Circle limit, enforced at mandate level)

### Changes

- Added `BusinessConfig` schema: handler config the business provides (`key_id`, `environment`)
- Added `PlatformConfig` schema: platform-level config (`environment`, optional `upi_apps`)
- Added `PaymentMethodUPICircle` schema: payment method type with opaque `delegate_id` reference issued by the PSP
- Added `Credential` schema: `delegated_payment_credential` type with `provider` discriminator — one-time cryptogram fetched from the PSP's TSP before each checkout; `provider` field identifies which PSP's format is in use (e.g., `"razorpay"`)
- Added `Allowance` schema: per-transaction constraints (amount, expiry, merchant)
- Added `DelegatePaymentRequest` schema: combines `PaymentMethodUPICircle` + `Credential` + `Allowance` + `risk_signals` + `metadata` (extends base ACP `DelegatePaymentRequest` with a UPI Circle-specific `credential` field)
- Added `DelegatePaymentResponse` schema: generic `id` + `created` + `metadata` response (PSP-specific values in metadata)
- Added `Error` schema: aligned error types and codes with ACP delegate_payment pattern
- Added examples: 1 request, 1 success response, 6 error cases (Razorpay reference implementation)

### Files Updated

- `spec/unreleased/json-schema/schema.upi_circle.json` (new file)
- `examples/unreleased/examples.upi_circle.json` (new file)

### Integration Flow

**Subsequent Purchases (ACP Protocol)**:

1. Platform discovers `dev.acp.upi_circle` handler in business UCP profile; confirms buyer has active `delegate_id`
2. Platform fetches a fresh `delegated_payment_credential` from the PSP's TSP using stored `delegate_id` and `key_id`
3. Platform submits `DelegatePaymentRequest` with `payment_method`, `credential` (including `provider`), `allowance`, `metadata`
4. On success, receives `DelegatePaymentResponse` with `id`, `created`, `metadata`
5. Merchant reconciles via PSP-specific values in `metadata` (e.g., `payment_id`, `upi_txn_id`)

### Mandate Setup — Reference Implementation (Razorpay)

> The following describes Razorpay's implementation of the `dev.acp.upi_circle` handler.
> Other PSPs supporting UPI Circle may implement mandate setup differently.
> These steps are **not** ACP protocol requirements — they are reference documentation
> for teams integrating with Razorpay specifically.

UPI Circle mandate setup is a one-time bilateral integration between the Platform and the PSP — it is not part of the ACP protocol, just as saving a card on a platform is not part of the checkout protocol.

1. User initiates UPI Circle setup with mobile number on the platform
2. Platform calls Razorpay TSP to initiate OTP verification
3. User receives OTP and provides it on the platform
4. Razorpay returns a delegation intent URL
5. User approves mandate in their UPI app (sets limits and confirms)
6. Platform polls Razorpay for delegation status
7. On confirmation, Razorpay returns `delegate_id` — platform stores against `acp_user_id`

### Security Considerations

- **Credential Freshness**: Platforms MUST verify `credential.expires_at` before submission and fetch a new credential if expired
- **Opaque Identifiers**: `delegate_id` is an opaque reference issued by the PSP. Platforms MUST NOT parse or pattern-match its value — the format is PSP-internal and may change
- **Single-Use Credentials**: Each `delegated_payment_credential` authorizes exactly one debit. Platforms MUST fetch a new credential for each transaction; reuse will be rejected
- **Idempotency**: Recommended on `checkout_session_id` to prevent double fulfillment
- **Mandate Limits**: Per-transaction and monthly limits are enforced by NPCI and the buyer's bank at the mandate level — not by ACP config

### Business Rules

- Mandate setup requires explicit user consent with clear display of: max amount, expiry, merchant
- No recurring subscriptions — intended for agent-initiated single transactions within mandate window

### Platform Requirements

- Platform MUST store `delegate_id` returned from PSP mandate onboarding against `acp_user_id`
- Platform MUST fetch a fresh `delegated_payment_credential` from the PSP's TSP for each transaction using `delegate_id` and `key_id`
- Platform MUST treat `delegate_id` as opaque — do not parse or pattern-match its value
- Platform MUST check `credential.expires_at` before submitting `DelegatePaymentRequest`

### Reference

- **Handler Spec**: https://example.com/schemas/upi-circle/bundle.schema.json
- **UPI Circle Spec**: https://www.npci.org.in/what-we-do/upi/upi-circle-spec
- **Razorpay UPI Circle Docs**: https://razorpay.com/docs/payments/upi-circle
- **Author**: Razorpay Software Private Ltd
