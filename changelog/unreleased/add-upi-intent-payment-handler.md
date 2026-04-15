## Add UPI Intent Payment Handler

This change adds support for UPI Intent payments as a delegated payment method within ACP. UPI (Unified Payments Interface) is India's real-time payment system with 600M+ users and $2.6T annual transaction volume. This handler enables buyers to complete payment by launching their preferred UPI app via a deep link on mobile or scanning a QR code on desktop — with no card data or pre-authorization required.

### Problem Statement

ACP's `delegate_payment` endpoint supports card-based credentials. For India, cards are not the dominant payment method — UPI is. Indian merchants have no ACP-native path for UPI payments; every transaction requires a redirect, even after purchase intent is expressed in-chat.

### Solution: UPI Intent

UPI Intent uses NPCI's UPI Linking Specification to generate a `upi://` deep link or QR code per transaction. The user opens their UPI app, reviews, and approves. No stored credentials, no PIN transmitted through ACP — the NPCI network handles authentication end-to-end.

### Key Features

- **No Pre-Authorization Required**: Each transaction is user-initiated via deep link or QR scan — no mandate setup needed
- **OS-Native UPI App Selection**: Platforms use Android implicit intents or iOS URL schemes; the OS presents all installed UPI apps automatically
- **Desktop QR Fallback**: Cross-device payment via QR code for non-mobile contexts
- **Zero PCI-DSS Scope**: VPA-based addressing; no card data in any ACP message
- **ACP delegate_payment Compatible**: Uses `DelegatePaymentRequest` / `DelegatePaymentResponse` envelope — same shape as card handler

### Handler Details

- **Handler Name**: `com.razorpay.upi_intent`
- **Version**: `2026-04-07`
- **ACP Version**: `2025-09` (GA) and later
- **Currency Support**: `INR` only
- **Maximum Transaction**: ₹1,00,000 (bank-configurable per NPCI)

### Changes

- Added `BusinessConfig` schema: handler config the business provides (`key_id`, `merchant_vpa`, `environment`)
- Added `PlatformConfig` schema: platform-level config (`environment`, optional `upi_apps` ordering)
- Added `PaymentMethodUPIIntent` schema: payment method with `intent_uri`, `transaction_reference`, `qr_code_data`, `expires_at`
- Added `Allowance` schema: per-transaction constraints — identical shape to base ACP `Allowance`
- Added `DelegatePaymentRequest` schema: `PaymentMethodUPIIntent` + `Allowance` + `risk_signals` + `metadata`
- Added `DelegatePaymentResponse` schema: generic `id` + `created` + `metadata` envelope (PSP-specific values in metadata)
- Added `Error` schema: single error object with `type` + `code` enums, aligned with base ACP `Error` schema
- Added examples: 1 request, 1 success response, 7 error cases

### Files Updated

- `spec/unreleased/json-schema/schema.upi_intent.json` (new file)
- `examples/unreleased/examples.razorpay_upi_intent.json` (new file)

### Integration Flow

**Each Transaction (ACP Protocol)**:

1. Platform discovers `com.razorpay.upi_intent` in business ACP handler configuration
2. Platform generates NPCI-compliant `upi://` intent URI and QR code using `merchant_vpa` and `checkout_session_id`
3. Platform presents deep link (mobile) or QR code (desktop) to the user
4. User approves payment in their UPI app
5. Platform submits `DelegatePaymentRequest` with `PaymentMethodUPIIntent`, `allowance`, and empty `risk_signals`
6. On success, receives `DelegatePaymentResponse` with `id`, `created`, `metadata` (including `payment_id` and `upi_txn_id`)

### Security Considerations

- **Intent URI Expiry**: Platforms MUST check `payment_method.expires_at` before submission; expired URIs are rejected
- **No Sensitive Data in URI**: Intent URI contains only merchant VPA, amount, and transaction reference — no user credentials
- **Idempotency**: Required via `Idempotency-Key` header; use `checkout_session_id` as the key
- **No Credential Storage**: UPI Intent is transaction-scoped; no persistent credential stored against user

### Platform Requirements

- Platform MUST generate a fresh `upi://` intent URI and QR code per transaction
- Platform MUST verify `payment_method.expires_at` before submitting `DelegatePaymentRequest`
- Platform SHOULD set 15-minute expiry on intent URIs per NPCI best practice
- Platform SHOULD poll for payment completion at max 5-second intervals per NPCI best practice
- Platform SHOULD use `checkout_session_id` as `transaction_reference` in the intent URI for correlation

### Reference

- **NPCI UPI Linking Specification**: https://www.npci.org.in/what-we-do/upi/product-overview
- **Razorpay UPI Docs**: https://razorpay.com/docs/payments/payment-methods/upi/
- **Author**: Razorpay Software Private Ltd
