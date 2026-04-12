## Add Razorpay Magic Checkout Payment Handler

This change adds support for Razorpay Magic Checkout as a hosted checkout (redirect-based) payment handler for the Agentic Commerce Protocol (ACP). This handler enables Indian merchants to accept payments via UPI, Cards, Netbanking, Wallets, EMI, BNPL, and Cash on Delivery through Razorpay's conversion-optimized Magic Checkout UI.

### Key Features

- **Hosted Checkout Pattern**: Delegates entire payment flow (address capture, payment method selection, authorization) to Razorpay's trusted UI via standard ACP External Checkout mechanism
- **Full India Payment Coverage**: Supports all major Indian payment methods including UPI, Cards (Debit/Credit), Netbanking, Wallets, EMI, Buy Now Pay Later, and Cash on Delivery
- **Zero Platform SDK Required**: Uses existing `window.openai.requestCheckout()` and `complete_checkout` MCP tool - no credential handling or token management needed
- **Proven Conversion**: Leverages Razorpay Magic Checkout trusted by 10M+ merchants with auto-fill for returning users

### Handler Details

- **Handler ID**: `com.razorpay.magic_checkout`
- **Version**: `2026-04-07`
- **ACP Version**: `2025-09` (GA) and later
- **Currency Support**: INR only
- **Checkout Type**: `redirect` (hosted checkout)

### Changes

- Added JSON Schema definition for Razorpay Magic Checkout handler configuration, credentials, and instruments
- Added comprehensive examples including handler declaration, checkout initiation, Razorpay order creation, webhook processing, and error scenarios
- Documented merchant integration prerequisites (Razorpay account, API credentials, webhook configuration)
- Specified security requirements (webhook signature verification, HTTPS enforcement, session binding)

### Files Updated

- `spec/unreleased/json-schema/schema.razorpay_magic_checkout.json` (new file)
- `examples/unreleased/examples.razorpay_magic_checkout.json` (new file)

### Integration Flow

1. Merchant advertises handler in ACP App manifest with `com.razorpay.magic_checkout`
2. ChatGPT runtime calls `requestCheckout` with `checkout_type: redirect`
3. Merchant MCP server creates Razorpay Order and returns Magic Checkout URL
4. ChatGPT runtime opens Magic Checkout via `openExternal()`
5. Buyer completes payment in Razorpay's hosted UI
6. Razorpay fires webhook to merchant
7. Merchant calls `complete_checkout` MCP tool
8. ChatGPT closes session upon confirmation

### Security Considerations

- `key_secret` and `webhook_secret` remain in merchant backend only
- Webhook signatures verified via HMAC-SHA256 with constant-time comparison
- Session binding via `notes.acp_checkout_id` prevents cross-session attribution
- All URLs enforce HTTPS with TLS 1.2+
- No sensitive payment data (card numbers, UPI PIN) passes through ACP

### Reference

- PR: #<pr-number>
- Handler Spec: https://razorpay.com/acp/magic_checkout/2026-04-07/
- Razorpay Magic Checkout Docs: https://razorpay.com/docs/payments/magic-checkout/
- ACP External Checkout Docs: https://developers.openai.com/commerce#external-checkout
- Author: Razorpay Software Private Ltd
- Contact: himanshu.shekhar@razorpay.com
