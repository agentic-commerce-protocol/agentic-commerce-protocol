## Add Redirect Checkout Payment Handler

This change adds support for Redirect Checkout as a hosted checkout payment handler for the Agentic Commerce Protocol (ACP). This handler enables merchants to accept payments by redirecting buyers to a hosted payment page where the entire payment flow (address capture, payment method selection, authorization) is handled by the payment provider.

### Key Features

- **Hosted Checkout Pattern**: Delegates entire payment flow to the payment provider's hosted UI via standard ACP External Checkout mechanism
- **Universal Payment Support**: Configurable payment methods (upi, card, netbanking, wallet, emi, bnpl, cod) depending on provider capabilities
- **Zero Platform SDK Required**: Uses existing `window.openai.requestCheckout()` and `complete_checkout` MCP tool - no credential handling or token management needed
- **Return User Optimization**: Supports prefill data (email, contact, name) for auto-login and saved payment method loading

### Handler Configuration

The handler is configured with these key properties (see `PaymentMethodRedirect` in schema):

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `environment` | enum | Yes | `sandbox` or `production` |
| `merchant_id` | string | Yes | Merchant identifier (pattern: `^[a-zA-Z0-9_-]+$`) |
| `merchant_name` | string | Yes | Display name in checkout UI (max 100 chars) |
| `supported_methods` | array | No | Payment methods enabled (upi, card, netbanking, wallet, emi, bnpl, cod) |

### Credential Schema

The checkout credential (`Credential` in schema) includes:

- `type`: Always `"hosted_checkout"`
- `session_id`: Payment provider order ID for webhook correlation
- `return_url`: HTTPS URL for successful payment redirect
- `cancel_url`: HTTPS URL for abandoned/cancelled payment
- `prefill`: Buyer data (email, contact, name) for auto-fill
- `retry`: Retry configuration (enabled, max_count)
- `notes`: Metadata including required `acp_checkout_id` for session binding
- `integration`: Analytics metadata (source, referer)

### Webhook Events

The handler processes these webhook events (`WebhookEvent` in schema):

- `payment.captured`: Payment successfully completed
- `order.paid`: Full order paid (alternative success event)
- `payment.failed`: Payment attempt failed

### Error Handling

Standard error structure (`Error` in schema) with:

- `type`: High-level category (invalid_request, rate_limit_exceeded, processing_error, service_unavailable)
- `code`: Specific error code including:
  - `invalid_merchant_id`, `checkout_disabled`, `unsupported_currency`
  - `order_creation_failed`, `checkout_expired`
  - `invalid_card`, `duplicate_request`, `idempotency_conflict`, `too_many_requests`
  - `idempotency_key_required`, `idempotency_in_flight`
- `message`: Human-readable description
- `param`: JSONPath to offending field
- `supported_versions`: For version-related errors

### Files Added

- `spec/unreleased/json-schema/schema.redirect_checkout.json` - Generic redirect checkout schema
- `examples/unreleased/examples.razorpay_magic_checkout.json` - Reference implementation using Razorpay Magic Checkout

### Integration Flow

1. Merchant advertises handler in ACP App manifest with their provider-specific handler ID
2. ChatGPT runtime calls `requestCheckout` with `checkout_type: redirect`
3. Merchant MCP server creates payment order and returns hosted checkout URL
4. ChatGPT runtime opens hosted checkout via `openExternal()`
5. Buyer completes payment in the provider's hosted UI
6. Payment provider fires webhook to merchant
7. Merchant calls `complete_checkout` MCP tool
8. ChatGPT closes session upon confirmation

### Security Considerations

- API secrets and webhook secrets remain in merchant backend only
- Webhook signatures verified via HMAC-SHA256 with constant-time comparison
- Session binding via `notes.acp_checkout_id` prevents cross-session attribution
- All URLs enforce HTTPS with TLS 1.2+
- No sensitive payment data (card numbers, PINs) passes through ACP

### Reference Implementations

- **Razorpay Magic Checkout** (India) - Included as reference implementation
- Other hosted checkout providers can use this schema as foundation

### References

- Handler Spec: https://acp.commerce/redirect_checkout/2026-04-07/
- ACP External Checkout Docs: https://developers.openai.com/commerce#external-checkout
