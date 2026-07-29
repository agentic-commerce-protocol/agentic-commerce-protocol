## Add Redirect / Hosted Checkout Handler

This change adds support for the **Redirect / Hosted Checkout** pattern as a generic payment handler for the Agentic Commerce Protocol (ACP). It enables merchants to accept payments by directing buyers to a provider-hosted checkout page, where the entire payment flow (address capture, method selection, authorization) is handled by the payment provider.

ACP's contract for this pattern is intentionally minimal: _here is a URL, send the buyer there, tell me when they come back_. Everything that happens on the hosted page is opaque to ACP. Provider-specific operations such as order creation and webhook handling are merchant-backend concerns outside the ACP protocol boundary.

Razorpay Magic Checkout (India) is included as a reference implementation.

### Key Features

- **Hosted Checkout Pattern**: Delegates the entire payment flow to the provider's hosted UI via the standard ACP External Checkout mechanism (`openExternal()` + `complete_checkout`)
- **Zero Platform SDK Required**: No credential handling or token management in ACP — all provider secrets stay in the merchant backend
- **Provider-agnostic Design**: The schema is minimal and generic; provider-specific fields live in reference implementation examples, not the base schema

### Handler Configuration

The handler is configured via `PaymentMethodRedirect` (see schema):

| Property | Type | Required | Description |
|---|---|---|---|
| `environment` | enum | Yes | `sandbox` or `production` |
| `merchant_id` | string | Yes | Merchant identifier assigned by the provider |
| `merchant_name` | string | Yes | Display name in checkout UI (max 100 chars) |
| `supported_methods` | array | No | Provider-defined hint about available payment methods; the hosted page controls actual selection |

### Credential Schema

The checkout credential (`Credential` in schema) is minimal by design:

| Field | Required | Description |
|---|---|---|
| `type` | Yes | Always `"hosted_checkout"` |
| `checkout_url` | Yes | HTTPS URL of the provider-hosted checkout page; opened via `openExternal()` |
| `session_id` | No | Opaque provider session ID for correlating the `complete_checkout` call |
| `return_url` | Yes | HTTPS URL provider redirects buyer to after successful payment |
| `cancel_url` | Yes | HTTPS URL provider redirects buyer to on abandonment or cancellation |

Provider-specific fields (e.g., prefill data, retry configuration, analytics metadata) are assembled by the merchant backend and embedded in `checkout_url` as provider-defined query parameters. They are not part of the ACP schema.

### Integration Flow

1. Merchant advertises handler in ACP App manifest with their provider-specific handler ID
2. ACP runtime calls `requestCheckout` with `checkout_type: redirect`
3. Merchant MCP server creates a provider session (PSP-specific) and returns a `Credential` with `checkout_url`
4. ACP runtime opens the hosted checkout via `openExternal(checkout_url)`
5. Buyer completes payment in the provider's hosted UI
6. Provider notifies merchant backend (via webhook or return URL redirect) — this is between merchant and provider, outside ACP
7. Merchant backend calls `complete_checkout` MCP tool to notify ACP that payment is confirmed
8. ACP runtime closes the session

### Error Handling

Standard error structure (`Error` in schema):

- `type`: High-level category (`invalid_request`, `rate_limit_exceeded`, `processing_error`, `service_unavailable`)
- `code`: Provider-defined string for programmatic handling
- `message`: Human-readable description
- `param`: JSONPath to the offending field (optional)
- `supported_versions`: Supported API versions, newest first (version-related errors only)

### Security Considerations

- API secrets and webhook secrets remain in the merchant backend only
- All URLs must use HTTPS (TLS 1.2+)
- No sensitive payment data (card numbers, PINs) passes through ACP
- Session correlation between ACP checkout ID and provider session is a merchant-backend responsibility

### Files Added

- `spec/unreleased/json-schema/schema.redirect_checkout.json` — Generic redirect / hosted checkout schema
- `examples/unreleased/examples.razorpay_magic_checkout.json` — Reference implementation: Razorpay Magic Checkout (India)

### Reference Implementations

- **Razorpay Magic Checkout** (India) — see `examples/unreleased/examples.razorpay_magic_checkout.json`
- Other hosted checkout providers (Stripe Checkout, PayPal, Adyen Drop-in, etc.) can implement this schema using the same pattern
