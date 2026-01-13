# Unreleased

## Added

### Affiliate Attribution Extension

Added support for the **Affiliate Attribution** extension, enabling agents to credit third-party publishers (affiliates) without relying on cookies, redirects, or client-side tracking.

**Schema Changes:**
- Added `AffiliateAttribution` object to JSON Schema and OpenAPI specifications
- Added `AffiliateAttributionSource` for attribution source context
- Added `AffiliateAttributionMetadata` for flat key/value additional context
- Added `touchpoint` field (`first` | `last`) to support multi-touch attribution models
- Extended `CheckoutSessionCreateRequest` to accept optional `affiliate_attribution` (first-touch)
- Extended `CheckoutSessionCompleteRequest` to accept optional `affiliate_attribution` (last-touch)

**Key Features:**
- **Multi-touch support:** Capture attribution at both session creation (first-touch) and completion (last-touch); networks determine weighting
- **Write-only:** Attribution data is accepted but never returned in responses (GET, list, webhooks)
- **Write-once with idempotency:** First valid attribution claim wins; conflicting claims with different/missing `Idempotency-Key` are silently ignored, but reusing the same `Idempotency-Key` with a different payload returns **409 Conflict**
- **Fraud-resistant:** Supports opaque provider-issued tokens for out-of-band validation
- **Privacy-preserving:** No user PII permitted; fields must not contain emails, phone numbers, or stable user identifiers
- **Forward-compatible:** Schema allows unknown fields to support future extensions (per RFC §8.2)

**Endpoints Updated:**
- `POST /checkout_sessions` — Create Session (first-touch attribution)
- `POST /checkout_sessions/{id}/complete` — Complete Session (last-touch attribution)

See [RFC: Affiliate Attribution](../rfcs/rfc.affiliate_attribution.md) for full specification details.
