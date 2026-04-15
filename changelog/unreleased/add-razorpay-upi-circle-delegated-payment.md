## Add Razorpay UPI Circle Delegated Payment Handler

This change adds support for UPI Circle (NPCI's delegated payment system) as a delegated payment handler for the Agentic Commerce Protocol (ACP). This enables agent-initiated UPI payments within pre-authorized mandates for the Indian market.

### Problem Statement

ACP's Instant Checkout supports delegated payment via Single-use Payment Tokens (SPT) from Stripe, Adyen, or Braintree, but no equivalent exists for India — 600M+ active UPI users, $2.6T annual transaction volume. Indian merchants must fall back to browser redirect for every transaction, even when users have expressed purchase intent in-chat.

### Solution: UPI Circle

UPI Circle (launched by NPCI in 2024) allows a primary UPI account holder to grant an AI agent pre-authorized spending power within defined limits (amount ceiling, merchant category, expiry). Once the mandate is set up, the agent executes payments autonomously without prompting for UPI PIN on each transaction.

### Key Features

- **Agent-Initiated Payments**: Execute UPI debits without real-time user PIN entry (within mandate limits)
- **Pre-Authorized Mandates**: User grants spending authority once, reuses for multiple purchases
- **India Market Coverage**: Supports 600M+ UPI users via NPCI infrastructure
- **Instant Checkout Compatible**: Uses existing ACP `requestCheckout` with `checkout_type: instant`
- **Mandate Management**: Ceiling tracking, expiry handling, user-initiated revocation

### Handler Details

- **Handler Name**: `com.razorpay.upi_circle`
- **Version**: `2026-04-07`
- **ACP Version**: `2025-09` (GA) and later
- **Currency Support**: INR only
- **Checkout Type**: `instant` (delegated payment)
- **Maximum Transaction**: ₹15,000 (NPCI UPI Circle limit)

### Changes

- Added JSON Schema for UPI Circle handler configuration, mandate storage, and payment confirmation
- Added payment_provider schema extension with `name: "razorpay"` and `payment_type: "upi_circle"`
- Added complete_checkout MCP tool payload schema with UPI-specific fields (upi_txn_id, mandate_id, agent_initiated)
- Added comprehensive examples for mandate onboarding, checkout flow, API calls, and error scenarios

### Files Updated

- `spec/unreleased/json-schema/schema.razorpay_upi_circle.json` (new file)
- `examples/unreleased/examples.razorpay_upi_circle.json` (new file)

### Integration Flow

**Mandate Setup (One-Time)**:
1. Merchant widget opens Razorpay UPI Circle onboarding URL via `window.openai.openExternal()`
2. User authenticates with UPI PIN and approves mandate
3. Razorpay returns `mandate_id` to merchant backend
4. Merchant stores mandate against `acp_user_id`

**Subsequent Purchases**:
1. Widget calls `window.openai.requestCheckout()` with `payment_type: upi_circle`
2. Platform validates mandate (ceiling, expiry) and shows pre-confirmation
3. User confirms, platform calls Razorpay UPI Circle debit API
4. Platform calls `complete_checkout` MCP tool with payment confirmation
5. Merchant verifies HMAC-SHA256 signature server-side
6. Order fulfilled, user notified

### Security Considerations

- **HMAC-SHA256 Signature**: All `complete_checkout` calls include Razorpay signature for verification
- **Server-Side Verification**: Merchants MUST verify signature before order fulfillment
- **Mandate Validation**: Platform validates `mandate_max_amount` and `mandate_expiry` before each debit
- **NPCI Limit Enforcement**: Hard limit of ₹15,000 per transaction (UPI Circle spec)
- **Idempotency**: Recommended on `order_id` to prevent double fulfillment

### Business Rules

- Mandate setup requires explicit user consent with clear display of: max amount, expiry, merchant
- Auto-revocation or user notification when mandate expires or ceiling is consumed
- Optional pre-confirmation when amount exceeds 80% of mandate ceiling
- Post-payment user notification with amount, merchant, order ID
- No recurring subscriptions — intended for agent-initiated single transactions within mandate window

### Platform Requirements

- Add `"razorpay"` to payment_provider name enum in ACP schema
- Add `"upi_circle"` to payment_type enum alongside existing types
- Validate mandate constraints before executing debits
- Surface mandate management UI for users to view/revoke active mandates

### Reference

- **PR**: #<pr-number>
- **Handler Spec**: https://example.com/schemas/upi-circle/bundle.schema.json
- **UPI Circle Spec**: https://www.npci.org.in/what-we-do/upi/upi-circle-spec
- **Razorpay UPI Circle Docs**: https://razorpay.com/docs/payments/upi-circle
- **Author**: Razorpay Software Private Ltd
- **Contact**: himanshu.shekhar@razorpay.com
