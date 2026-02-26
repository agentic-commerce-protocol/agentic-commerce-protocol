# Unreleased Changes

## Webhook signing: Stripe-aligned format and replay protection

Specifies the Merchant-Signature header format for agentic checkout webhooks and adds replay protection. Aligns with Stripe’s webhook signature scheme for interoperability.

### Changes

- **Signature format:** Header value is `t=<unix_seconds>,v1=<64_hex>`. Signed payload is `timestamp + "." + raw_body`; HMAC-SHA256 with shared secret. Pattern accepts hex (`[a-fA-F0-9]{64}`).
- **Replay protection:** Receiver rejects requests when timestamp `t` is outside an allowed window. Recommended tolerance 300 seconds. Description states that signing is used to prevent replay attacks and to verify authenticity and integrity.

### Breaking Changes

None. This defines the format of an already-required header (signing was already mandatory).

### Files Updated

- `spec/unreleased/openapi/openapi.agentic_checkout_webhook.yaml`
