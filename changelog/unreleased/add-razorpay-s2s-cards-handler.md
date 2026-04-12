## Add Razorpay S2S Cards Payment Handler

This change adds support for Server-to-Server (S2S) card payments as a checkout option within the Agentic Commerce Protocol (ACP). Unlike hosted-checkout handlers, S2S card payments keep buyers entirely within the ChatGPT conversation flow. The ChatGPT runtime presents a native card collection UI, tokenizes cards via Razorpay.js, and charges cards directly via Razorpay's S2S API without redirects. This handler is fully compliant with RBI's Card-on-File Tokenization (CoFT) mandate for India-issued cards.

### Key Features

- **Native In-Chat Checkout** — Buyer never leaves ChatGPT; card UI rendered by runtime
- **RBI CoFT Compliant** — All India cards tokenized via Razorpay Token HQ; no raw PAN storage
- **3DS 2.0 Supported** — Runtime renders OTP/3DS challenge inline; no redirect required
- **Saved Cards** — Returning buyers pay with one tap using previously tokenized cards
- **Full Card Coverage** — Visa, Mastercard, RuPay, Amex; Debit and Credit; EMI support
- **Zero PAN Exposure** — Only Razorpay token IDs exchanged; raw card numbers never transmitted

### Handler Details

- **Handler Name**: `com.razorpay.s2s_cards`
- **Version**: `2026-04-07`
- **ACP Version**: `2025-09` (GA) and later
- **Currency Support**: `INR` only
- **Checkout Type**: `instant` (with credential management)
- **Card Networks**: Visa, Mastercard, RuPay, Amex
- **Card Types**: Credit, Debit

### Integration Flow

#### Frictionless Flow (No 3DS)

```
1. Widget calls requestCheckout with payment_type: s2s_card
2. ChatGPT Runtime renders card UI (new entry or saved card selector)
3. Runtime tokenizes card via Razorpay.js → obtains token_id
4. Runtime calls merchant charge_card MCP tool with token_id
5. Merchant creates Razorpay order + initiates S2S charge
6. Bank approves without 3DS challenge (frictionless)
7. Runtime calls complete_checkout → Order fulfilled
```

#### 3DS Challenge Flow

```
1-5. Same as frictionless flow
6. Bank requires 3DS; Razorpay returns ACS URL
7. Merchant returns requires_3ds_challenge
8. Runtime renders 3DS/OTP challenge inline in secure iframe
9. Buyer enters OTP/biometric
10. Runtime calls submit_otp MCP tool
11. Runtime polls get_checkout for final status
12. Webhook confirms payment.captured
13. Runtime calls complete_checkout → Order fulfilled
```

### Changes

- Added JSON Schema for S2S Cards handler configuration (merchant_id, key_id, supported networks/types, EMI/save options)
- Added card instrument schema with Token HQ token_id support (never raw PAN)
- Added MCP tool schemas: charge_card, submit_otp, complete_checkout
- Added payment provider configuration with payment_type: s2s_card
- Added frictionless and 3DS challenge response schemas
- Added RBI CoFT Token HQ lifecycle documentation
- Added comprehensive examples for card tokenization, 3DS inline rendering, and error handling
- Added webhook schemas for payment.authorized, payment.captured, payment.failed

### Files Updated

- `spec/unreleased/json-schema/schema.razorpay_s2s_cards.json` (new file)
- `examples/unreleased/examples.razorpay_s2s_cards.json` (new file)

### Platform Requirements

- **Razorpay.js SDK** — Load and initialize with merchant's key_id to tokenize cards securely
- **Card Collection UI** — Render secure card entry form and saved card selector
- **3DS Inline Renderer** — Render 3DS/OTP challenge in isolated iframe with CSP headers
- **Device Fingerprinting** — Collect IP, user agent, device data for fraud signals
- **Token HQ Integration** — Read and store token_ids per buyer+merchant pair

### MCP Tools Required

| Tool | Purpose |
|------|---------|
| `charge_card` | Initiate S2S charge; return payment status or 3DS escalation |
| `submit_otp` | Submit buyer's OTP/3DS response |
| `get_checkout` | Poll for final payment status after 3DS |
| `complete_checkout` | Final confirmation after payment captured |

### RBI CoFT Compliance (Token HQ)

**Token Lifecycle**:
- **First-time entry**: Raw PAN encrypted by Razorpay.js; Token HQ issues token_id
- **Storage**: Token stored against customer_id; raw PAN never written to merchant or ACP
- **Subsequent purchase**: Runtime retrieves token_id from Token HQ; no PAN re-entry
- **S2S charge**: Merchant calls POST /v1/payments with token_id; Razorpay de-tokenizes internally
- **Auto-refresh**: Razorpay auto-refreshes tokens on network updates (card replacement, expiry)

### Security Considerations

- **No PAN in ACP**: Raw card numbers MUST NOT appear in any ACP MCP tool call or log
- **CVV Encrypted**: CVV encrypted via Razorpay.js before transmission; never stored
- **Webhook Signature**: Verify X-Razorpay-Signature via HMAC-SHA256 with constant-time comparison
- **Key Secret Isolation**: key_secret resides only in merchant backend; never shared with runtime
- **3DS Inline Rendering**: ACS frame rendered in isolated iframe with CSP headers; no parent-frame JS access
- **Token Binding**: token_id bound to customer_id + merchant; cross-merchant reuse blocked
- **Idempotent Charges**: Merchant deduplicates on acp_checkout_id to prevent double-charge
- **HTTPS Everywhere**: All API calls, webhooks, ACS interactions use TLS 1.2+
- **RBI CoFT Compliance**: Token HQ tokenization mandatory for all India-issued cards

### 3DS 2.0 Authentication Flow

| Stage | Action |
|-------|--------|
| Device data collection | Razorpay.js collects browser fingerprint; sends to ACS via 3DS2 DeviceData |
| Frictionless check | ACS performs risk assessment; if low risk → approval (no OTP) |
| Challenge trigger | If ACS requires challenge → Razorpay returns ACS URL to merchant → runtime |
| OTP verification | Buyer enters OTP in inline ACS frame; ACS returns authentication result |
| Authorization | Razorpay routes authorized payment to network; bank approves/declines |
| Capture | Merchant calls capture API; Razorpay fires payment.captured webhook |

### Error Handling

| Code | Severity | Description | Resolution |
|------|----------|-------------|------------|
| `invalid_token` | recoverable | Token expired/invalid | Re-tokenize via card entry |
| `cvv_required` | requires_buyer_input | CVV required | Prompt re-enter CVV |
| `insufficient_funds` | requires_buyer_input | Card balance low | Use another card |
| `card_declined` | recoverable | Bank declined | Retry or alternative |
| `authentication_failed` | recoverable | OTP incorrect | Retry with resend |
| `card_expired` | requires_buyer_input | Card expired | Enter valid card |
| `daily_limit_exceeded` | requires_buyer_input | Daily limit reached | Try tomorrow |
| `international_blocked` | recoverable | Intl tx blocked | Use domestic card or UPI |

### Reference

- **PR**: #<pr-number>
- **Handler Spec**: https://razorpay.com/acp/s2s_cards/2026-04-07/
- **Razorpay S2S API**: https://razorpay.com/docs/api/payments/s2s/
- **Razorpay Token HQ**: https://razorpay.com/docs/payments/cards/token-hq/
- **Razorpay.js**: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/razorpayjs/
- **RBI CoFT Mandate**: https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12218
- **EMV 3DS 2.0**: https://www.emvco.com/emv-technologies/3-d-secure/
- **Author**: Razorpay Software Private Ltd
- **Contact**: himanshu.shekhar@razorpay.com
