## Add S2S Cards Payment Handler

This change adds support for Server-to-Server (S2S) card payments as a delegated payment method within ACP. The handler enables merchants to charge a customer's previously saved card token directly via the PSP — no card data collection or UI rendering happens at checkout time. The buyer selects a saved card within the agent conversation, and the merchant charges the stored token server-to-server.

### Problem Statement

ACP's `delegate_payment` endpoint supports card-based credentials via network tokens. For India, PSPs operate their own Card-on-File Tokenization (CoFT) networks where merchants store customer card tokens. Indian merchants have no ACP-native path to charge these stored tokens without a redirect.

### Solution: S2S Cards via Stored Merchant Token

The merchant already holds the customer's card `token_id` from a prior tokenization (done outside ACP during card save). At checkout, the merchant submits a `DelegatePaymentRequest` with that token — ACP validates the allowance, and the merchant charges the token via the PSP's S2S API. No card UI, no PSP SDK, no raw PAN at checkout time.

### Key Features

- **Zero Checkout Friction**: No card entry at checkout — buyer selects saved card, merchant charges token
- **Zero PAN Exposure**: Only PSP token IDs transmitted through ACP; raw card numbers never present
- **No Redirect Required**: Entire flow is server-to-server; buyer stays in the agent conversation
- **Full Card Coverage**: Visa, Mastercard, RuPay, Amex; Debit and Credit
- **ACP delegate_payment Compatible**: Uses `DelegatePaymentRequest` / `DelegatePaymentResponse` envelope — same shape as other delegated payment handlers

### Handler Details

- **Handler Name**: `com.razorpay.s2s_cards`
- **Version**: `2026-04-07`
- **ACP Version**: `2025-09` (GA) and later
- **Currency Support**: `INR` only
- **Maximum Transaction**: ₹1,00,000 (bank-configurable per RBI guidelines)

### Changes

- Added `BusinessConfig` schema: handler config the business provides (`key_id`, `environment`, `supported_networks`, `supported_types`)
- Added `PlatformConfig` schema: platform-level config (`environment`)
- Added `PaymentMethodS2SCard` schema: saved card token with `token_id`, `card_network`, `card_last4`, `card_type` — no raw card fields
- Added `RiskSignal` schema: aligned with base ACP `RiskSignal` definition
- Added `Allowance` schema: per-transaction constraints — identical shape to base ACP `Allowance`
- Added `DelegatePaymentRequest` schema: `PaymentMethodS2SCard` + `Allowance` + optional `billing_address` + `risk_signals` + `metadata`
- Added `DelegatePaymentResponse` schema: generic `id` + `created` + `metadata` envelope (PSP-specific values in metadata)
- Added `Error` schema: single error object with `type` + `code` enums, aligned with base ACP `Error` schema
- Added examples: 1 request, 1 success response, 8 error cases (invalid_token, card_declined, card_expired, insufficient_funds, daily_limit_exceeded, international_blocked, idempotency_conflict, too_many_requests)

### Files Updated

- `spec/unreleased/json-schema/schema.s2s_cards.json` (new file)
- `examples/unreleased/examples.razorpay_s2s_cards.json` (new file)

### Integration Flow

**Each Transaction (ACP Protocol)**:

1. Platform discovers `com.razorpay.s2s_cards` in business ACP handler configuration
2. Merchant presents buyer's saved cards (fetched from PSP token store) within the conversation
3. Buyer selects a saved card
4. Merchant submits `DelegatePaymentRequest` with `token_id`, `allowance`, and `risk_signals`
5. ACP validates allowance (amount, expiry, merchant_id)
6. Merchant charges `token_id` via PSP S2S API server-to-server
7. PSP captures payment → merchant receives `payment_id`
8. Merchant returns `DelegatePaymentResponse` with `payment_id` and `order_id` in metadata
9. Platform calls `complete_checkout` → order fulfilled

### Security Considerations

- **No PAN in ACP**: Raw card numbers MUST NOT appear in any ACP field, log, or metadata
- **Allowance Expiry**: Merchants MUST verify `allowance.expires_at` before submitting; expired allowances are rejected
- **Idempotency**: Required via `Idempotency-Key` header; use `checkout_session_id` as the key to prevent double-charge
- **Token Binding**: PSP token bound to customer + merchant; cross-merchant reuse blocked by PSP

### Merchant Requirements

- Merchant MUST have customer's card token stored from a prior tokenization (out of band from ACP)
- Merchant MUST verify `allowance.expires_at` before submission
- Merchant SHOULD use `checkout_session_id` as `Idempotency-Key` to prevent double-charge

### Reference

- **Author**: Razorpay Software Private Ltd
- **Contact**: himanshu.shekhar@razorpay.com
