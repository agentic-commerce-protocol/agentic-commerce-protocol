## Add S2S Cards Payment Handler

This change adds support for Server-to-Server (S2S) card payments as a delegated payment method within ACP. S2S card payments keep buyers entirely within the agent conversation flow — the platform renders a native card collection UI, tokenizes cards via the PSP SDK, and charges them directly via the PSP's S2S API without redirects. For India-issued cards, this handler is compliant with RBI's Card-on-File Tokenization (CoFT) mandate; raw PANs are never stored or transmitted through ACP.

### Problem Statement

ACP's `delegate_payment` endpoint supports card-based credentials via network tokens. For India, PSPs operate their own CoFT tokenization networks that must be used for all card-not-present transactions. Indian merchants have no ACP-native path for S2S card payments that satisfies this requirement; every transaction either requires a redirect or exposes raw card data.

### Solution: S2S Cards with PSP Tokenization

The platform tokenizes the card via the PSP SDK (e.g., Razorpay.js), which encrypts the raw PAN and issues a PSP token. The token is passed through ACP — never the raw PAN or plaintext CVV. For transactions requiring 3DS authentication, the PSP returns an ACS URL which the platform renders inline in a secure iframe, keeping the buyer in the conversation.

### Key Features

- **No Redirect Required**: Card UI, tokenization, and 3DS challenge all rendered natively within the agent experience
- **Zero PAN Exposure**: Only PSP token IDs exchanged through ACP; raw card numbers never transmitted or logged
- **3DS 2.0 Inline**: Platform renders OTP/biometric challenge in isolated iframe — no context switch
- **Saved Cards**: Returning buyers pay with one tap using previously tokenized cards
- **Full Card Coverage**: Visa, Mastercard, RuPay, Amex; Debit and Credit; EMI support
- **ACP delegate_payment Compatible**: Uses `DelegatePaymentRequest` / `DelegatePaymentResponse` envelope — same shape as other delegated payment handlers

### Handler Details

- **Handler Name**: `com.razorpay.s2s_cards`
- **Version**: `2026-04-07`
- **ACP Version**: `2025-09` (GA) and later
- **Currency Support**: `INR` only
- **Maximum Transaction**: ₹1,00,000 (bank-configurable per RBI guidelines)

### Changes

- Added `BusinessConfig` schema: handler config the business provides (`key_id`, `environment`, `supported_networks`, `supported_types`, `emi_enabled`, `save_cards`)
- Added `PlatformConfig` schema: platform-level config (`environment`)
- Added `PaymentMethodS2SCard` schema: payment method with `token_id`, `card_network`, `card_last4`, `card_type`, `cvv`, `save_card`, `recurring`
- Added `RiskSignal` schema: aligned with base ACP `RiskSignal` definition
- Added `Allowance` schema: per-transaction constraints — identical shape to base ACP `Allowance`
- Added `DelegatePaymentRequest` schema: `PaymentMethodS2SCard` + `Allowance` + optional `billing_address` + `risk_signals` + `metadata`
- Added `DelegatePaymentResponse` schema: generic `id` + `created` + `metadata` envelope (PSP-specific values in metadata)
- Added `ThreeDSNextAction` schema: ACS redirect details for inline iframe rendering
- Added `Error` schema: single error object with `type` + `code` enums, aligned with base ACP `Error` schema
- Added examples: 2 requests (new card, saved card), 1 success response, 1 3DS response, 9 error cases

### Files Updated

- `spec/unreleased/json-schema/schema.s2s_cards.json` (new file)
- `examples/unreleased/examples.razorpay_s2s_cards.json` (new file)

### Integration Flow

**Each Transaction (ACP Protocol)**:

1. Platform discovers `com.razorpay.s2s_cards` in business ACP handler configuration
2. Platform renders card entry UI or saved card selector within the conversation
3. Platform tokenizes card via PSP SDK → obtains `token_id` (raw PAN encrypted; never leaves SDK)
4. Platform submits `DelegatePaymentRequest` with `PaymentMethodS2SCard`, `allowance`, and `risk_signals`
5. PSP initiates S2S charge using `token_id`
6. **Frictionless**: Bank approves without challenge → PSP returns captured → platform calls `complete_checkout`
7. **3DS required**: PSP returns ACS URL → platform renders inline iframe → buyer completes OTP/biometric → platform polls for captured → calls `complete_checkout`

### Security Considerations

- **Intent URI Expiry**: Platforms MUST verify `allowance.expires_at` before submission; expired allowances are rejected
- **No PAN in ACP**: Raw card numbers MUST NOT appear in any ACP MCP tool call, log, or metadata field
- **CVV Handling**: CVV encrypted by PSP SDK before transmission; MUST NOT be stored at any point
- **3DS Inline Rendering**: ACS iframe MUST be sandboxed with CSP headers; no parent-frame JavaScript access
- **Idempotency**: Required via `Idempotency-Key` header; use `checkout_session_id` as the key
- **Token Binding**: PSP token bound to customer + merchant; cross-merchant reuse blocked by PSP

### Platform Requirements

- Platform MUST tokenize cards via the PSP SDK before submitting `DelegatePaymentRequest`
- Platform MUST verify `allowance.expires_at` before submission
- Platform MUST render 3DS challenges in an isolated iframe with appropriate CSP headers
- Platform SHOULD poll for payment completion at max 5-second intervals after 3DS
- Platform SHOULD use `checkout_session_id` as `Idempotency-Key` to prevent double-charge

### Reference

- **Author**: Razorpay Software Private Ltd
- **Contact**: himanshu.shekhar@razorpay.com
