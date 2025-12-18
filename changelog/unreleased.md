# Unreleased

## Added

### Affiliate Attribution Extension

Added support for the **Affiliate Attribution** extension, enabling agents to credit third-party publishers (affiliates) without relying on cookies, redirects, or client-side tracking.

**Schema Changes:**
- Added `AffiliateAttribution` object to JSON Schema and OpenAPI specifications
- Added `AffiliateAttributionSource` for attribution source context
- Added `AffiliateAttributionMetadata` for flat key/value additional context
- Extended `CheckoutSessionCreateRequest`, `CheckoutSessionUpdateRequest`, and `CheckoutSessionCompleteRequest` to accept optional `affiliate_attribution`

**Key Features:**
- **Write-only:** Attribution data is accepted but never returned in responses (GET, list, webhooks)
- **Write-once with idempotency:** First valid attribution claim wins; conflicting claims with different/missing `Idempotency-Key` are silently ignored, but reusing the same `Idempotency-Key` with a different payload returns **409 Conflict**
- **Fraud-resistant:** Supports opaque provider-issued tokens for out-of-band validation
- **Privacy-preserving:** No user PII permitted; fields must not contain emails, phone numbers, or stable user identifiers
- **Forward-compatible:** Schema allows unknown fields to support future extensions (per RFC §8.2)

**Endpoints Updated:**
- `POST /checkout_sessions` — Create Session
- `POST /checkout_sessions/{id}` — Update Session
- `POST /checkout_sessions/{id}/complete` — Complete Session

See [RFC: Affiliate Attribution](../rfcs/rfc.affiliate_attribution.md) for full specification details.
