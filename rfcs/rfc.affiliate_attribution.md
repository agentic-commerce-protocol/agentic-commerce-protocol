# RFC: Agentic Checkout — Affiliate Attribution

**Status:** Proposal  
**Version:** 2025-12-17  
**Scope:** Extension of Agentic Checkout request schemas to support privacy-preserving, fraud-resistant affiliate attribution.

This RFC extends the **Agentic Checkout Specification (ACS)** to support **Affiliate Attribution**. It defines a standard, optional `affiliate_attribution` object that agents MAY attach to checkout session requests so merchants can deterministically credit third-party publishers (affiliates) without relying on cookies, redirects, or client-side tracking.

---

## 1. Motivation

Affiliate marketing is a core distribution channel for e-commerce. In traditional web flows, attribution is inferred via links, cookies, redirects, and pixels. In **agentic commerce**, the agent often performs discovery and comparison and may complete the purchase without a conventional “click trail,” breaking classic attribution primitives.

Without a standardized attribution signal:

- Merchants cannot reliably credit publishers who influenced the purchase.
- Affiliates are disincentivized to create high-quality commerce content.
- The ecosystem devolves into opaque, platform-controlled deals rather than open, interoperable referral economics.

This RFC proposes a minimal, privacy-preserving mechanism: the agent conveys a **fraud-resistant attribution claim** to the merchant at checkout time.

---

## 2. Goals and Non-Goals

### 2.1 Goals

1. **Deterministic attribution transport**: Define a standard object for conveying affiliate attribution from agent → merchant within ACS.
2. **Fraud resistance**: Prefer cryptographic / verifiable attribution via an opaque `token`.
3. **Privacy by design**: Avoid user identifiers, cookies, fingerprinting, or cross-site tracking.
4. **Protocol neutrality**: Support multiple affiliate networks/providers without privileging any one business model.
5. **Backwards compatible behavior**: The attribution object is optional and must not block checkout completion.

### 2.2 Non-Goals

- Defining commission rates, payout schedules, or settlement rails.
- Standardizing affiliate network verification APIs (token verification is out-of-band).
- Creating ranking incentives (“pay to win”) for agent recommendations.
- Defining how networks weight or combine first-touch and last-touch data (network-specific logic).

---

## 3. Design Rationale

### 3.1 Why structured data (not free-text)?

Free-text referral notes are non-actionable, hard to validate, and easy to game. A structured schema enables consistent parsing, verification, and analytics.

### 3.2 Why token-first?

A **provider-issued, opaque token** is the simplest way to support fraud resistance without baking any single network’s API into ACP. Merchants can validate tokens out-of-band with the provider they trust, similar to how payment tokens are validated via PSPs.

### 3.3 Why “write-only”?

Attribution often contains commercially sensitive data (publisher IDs, campaign identifiers, token secrets). The safest default is that it is **write-only**: accepted and stored by the merchant but not echoed back in responses.

### 3.4 Why attach to checkout requests?

Checkout session requests are the canonical merchant interaction surface in ACS. Attaching attribution here ensures the merchant can store the claim alongside the order system-of-record.

---

## 4. Specification Changes

### 4.1 Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **MAY** are to be interpreted as described in RFC 2119/8174.

### 4.2 New Object: `affiliate_attribution`

This RFC extends the following ACS request body schemas:

- `POST /checkout_sessions` — Create Session Request (first-touch attribution)
- `POST /checkout_sessions/{id}/complete` — Complete Session Request (last-touch attribution)

Agents MAY include a top-level `affiliate_attribution` object in either or both request bodies to support multi-touch attribution models.

#### 4.2.1 Schema (conceptual)

```json
{
  "affiliate_attribution": {
    "provider": "impact.com",
    "token": "atp_01J...base64url...",
    "publisher_id": "pub_123",
    "campaign_id": "cmp_456",
    "creative_id": "cr_789",
    "sub_id": "u1=abc&u2=def",
    "touchpoint": "first",
    "source": {
      "type": "url",
      "url": "https://publisher.example/reviews/best-espresso-machines"
    },
    "issued_at": "2025-12-17T10:30:00Z",
    "expires_at": "2025-12-24T10:30:00Z",
    "metadata": {
      "content_type": "article",
      "placement": "top_pick"
    }
  }
}
```

#### 4.2.2 Field Definitions

- `provider` (string, REQUIRED)
  Identifier for the attribution provider / affiliate network namespace.
  Implementations SHOULD use a stable identifier such as a DNS name (e.g., `impact.com`) or URN.

- `token` (string, RECOMMENDED)
  Opaque provider-issued token suitable for fraud-resistant validation.
  Tokens SHOULD be treated as secrets (do not log).
  Providers SHOULD bind tokens to at least the `merchant_id` and a unique nonce (`jti`) with an expiry (`exp`) in the provider’s internal format.

- `publisher_id` (string, CONDITIONALLY REQUIRED)
  Provider-scoped affiliate/publisher identifier.
  If `token` is omitted, `publisher_id` MUST be present.

- `campaign_id` / `creative_id` / `sub_id` (string, OPTIONAL)
  Provider-scoped tracking fields (e.g., campaign, creative, sub-IDs).
  These fields MUST NOT contain user PII.

- `touchpoint` (enum string, OPTIONAL)
  Attribution touchpoint type: `first` or `last`.
  - Use `first` when capturing attribution at session creation (first-touch).
  - Use `last` when capturing attribution at session completion (last-touch).
  Enables multi-touch attribution models where networks can capture and weight both touchpoints.

- `source` (object, OPTIONAL)
  Context about where the attribution originated.

  - `type` (enum string): `url | platform | unknown`
  - `url` (uri string, OPTIONAL): canonical content URL when `type=url`
    Agents SHOULD omit `source` unless necessary for audit/debug; it may expose competitive intelligence.

- `issued_at` / `expires_at` (RFC3339 timestamps, OPTIONAL)
  Informational timestamps. Providers SHOULD enforce expiry via `token`.

- `metadata` (object, OPTIONAL)
  Flat key/value map for additional non-sensitive context.

  - Keys MUST be strings.
  - Values MUST be strings, numbers, or booleans.
  - Arrays and nested objects are NOT permitted.
    Implementations MAY enforce limits (e.g., ≤ 20 keys, ≤ 4KB total).

#### 4.2.3 Validation Rules (non-exhaustive)

- `provider` MUST be present.
- At least one of `{ token, publisher_id }` MUST be present.
- `metadata` MUST be a flat object with primitive values only.
- Implementations SHOULD reject payloads containing obvious PII (emails, phone numbers) inside attribution fields.

---

## 4.3 Endpoint Semantics

### 4.3.1 Create Session: `POST /checkout_sessions` (First-Touch)

Agents MAY attach `affiliate_attribution` with `touchpoint: "first"` at session creation to record the initial attribution claim.

**Use cases:**
- Protecting first-touch attribution from hijacking by later agents.
- Capturing the publisher who initiated the shopping journey.

Servers SHOULD store first-touch attribution claims alongside the session for later reconciliation with last-touch data.

### 4.3.2 Complete Session: `POST /checkout_sessions/{id}/complete` (Last-Touch)

Agents MAY attach `affiliate_attribution` with `touchpoint: "last"` on completion to record the final attribution context.

**Use cases:**
- Last-touch attribution (industry default).
- Ensuring attribution is recorded only on successful conversions.

Servers SHOULD store last-touch attribution alongside the resulting order.

### 4.3.3 Multi-Touch Attribution

When attribution is provided at both create and complete:

| Scenario | Server Behavior |
|----------|-----------------|
| First-touch only (create) | Store and use for first-touch attribution models |
| Last-touch only (complete) | Store and use for last-touch attribution models (default) |
| Both touchpoints | Store both; network determines weighting |
| Same provider at both touchpoints | Keep both records for multi-touch analysis |
| Different providers at touchpoints | Keep both; each provider settles independently |

Servers MUST NOT block checkout due to attribution conflicts between touchpoints.

### 4.3.4 Visibility (Write-Only)

The `affiliate_attribution` object is **write-only**. Servers MUST NOT return attribution data in any read endpoint, including but not limited to:

- `GET /checkout_sessions/{id}` — Retrieve Session
- Any list or search endpoints that return checkout session objects
- Webhook payloads (unless explicitly configured by the merchant for internal use)

Merchants MAY expose attribution data through separate, authenticated audit or analytics feeds outside the scope of this specification. Such feeds are implementation-defined and SHOULD require elevated permissions.

**Rationale:** Attribution data may contain commercially sensitive information (publisher IDs, campaign terms, token secrets). Echoing this data in standard responses risks leakage to unintended parties and creates attack surface for attribution theft.

---

## 5. Example Interactions

### 5.1 Create Session with First-Touch Attribution (Request)

`POST /checkout_sessions`

```json
{
  "items": [{ "id": "item_123", "quantity": 1 }],
  "affiliate_attribution": {
    "provider": "impact.com",
    "token": "atp_01J8Z3WXYZ9ABC",
    "publisher_id": "pub_123",
    "touchpoint": "first"
  }
}
```

### 5.2 Complete Session with Last-Touch Attribution (Request)

`POST /checkout_sessions/{id}/complete`

```json
{
  "buyer": {
    "first_name": "John",
    "last_name": "Smith",
    "email": "johnsmith@mail.com",
    "phone_number": "15552003434"
  },
  "payment_data": {
    "token": "spt_123",
    "provider": "stripe",
    "billing_address": {
      "name": "John Smith",
      "line_one": "1234 Chat Road",
      "line_two": "",
      "city": "San Francisco",
      "state": "CA",
      "country": "US",
      "postal_code": "94131"
    }
  },
  "affiliate_attribution": {
    "provider": "impact.com",
    "token": "atp_01J8Z3WXYZ9ABC",
    "publisher_id": "pub_123",
    "touchpoint": "last"
  }
}
```

### 5.3 Response (200 OK)

The server returns the checkout session per ACS schema. `affiliate_attribution` is write-only and MUST NOT be echoed in responses.

```json
{
  "id": "cs_abc123",
  "status": "pending",
  "currency": "usd",
  "line_items": [
    {
      "id": "li_001",
      "item": { "id": "item_123", "quantity": 1 },
      "base_amount": 4999,
      "discount": 0,
      "subtotal": 4999,
      "tax": 412,
      "total": 5411
    }
  ],
  "totals": [
    { "type": "subtotal", "display_text": "Subtotal", "amount": 4999 },
    { "type": "tax", "display_text": "Tax", "amount": 412 },
    { "type": "fulfillment", "display_text": "Shipping", "amount": 0 },
    { "type": "total", "display_text": "Total", "amount": 5411 }
  ],
  "messages": [],
  "links": [
    { "type": "terms_of_use", "url": "https://merchant.example/terms" }
  ]
}
```

---

## 6. Error Handling

If `affiliate_attribution` is structurally invalid (wrong types, nested `metadata`, missing `provider`), the server SHOULD return **400 Bad Request** using the ACS flat error shape.

### 6.1 Structural Validation Error

```json
{
  "type": "invalid_request",
  "code": "invalid_type",
  "message": "affiliate_attribution.metadata values must be strings, numbers, or booleans.",
  "param": "$.affiliate_attribution.metadata"
}
```

### 6.2 PII Violation Error

If the server detects obvious PII in attribution fields (per Section 7.4), it SHOULD return **400 Bad Request** with code `pii_not_allowed`.

```json
{
  "type": "invalid_request",
  "code": "pii_not_allowed",
  "message": "affiliate_attribution fields must not contain personally identifiable information.",
  "param": "$.affiliate_attribution.metadata.user_email"
}
```

**Detection guidance:** Implementations SHOULD check for patterns resembling email addresses, phone numbers, and known PII field names (e.g., `email`, `phone`, `ssn`, `address`). Implementations MAY use heuristics or allowlists. False positives are preferable to PII leakage.

### 6.3 Non-Errors

- **Unknown `provider` values** are NOT an error; the field is provider-namespaced and is intended to be extensible.
- **Attribution conflicts** (per Section 4.3.1) are handled silently and do NOT produce user-visible errors, except for `409 Conflict` on idempotency key mismatch.

---

## 7. Security & Privacy Considerations

### 7.1 Token confidentiality

- Tokens SHOULD be treated as secrets.
- Merchants MUST avoid logging tokens in plaintext.

### 7.2 Replay and theft

Providers SHOULD design tokens so they are not reusable across:

- merchants (`aud` / merchant binding),
- sessions (`checkout_session_id` binding), and/or
- time (`exp`).

### 7.3 Attribution hijacking

Write-once behavior reduces the risk that later requests “overwrite” attribution at the last moment.

### 7.4 PII minimization

`affiliate_attribution` MUST NOT contain user PII. Agents SHOULD not include:

- user emails, phone numbers, addresses,
- stable user identifiers,
- device fingerprints.

### 7.5 Ranking integrity

Agents MUST NOT treat `affiliate_attribution` as a ranking boost mechanism. The object is strictly for post-selection attribution/settlement.

### 7.6 Idempotency & Conflict Handling

Attribution requests MUST be idempotent. Clients SHOULD include an `Idempotency-Key` header per ACS Section 2.3 when submitting attribution.

Key guarantees:

- **Identical replay:** Same `Idempotency-Key` + same payload → success, no duplicate record.
- **Payload mismatch:** Same `Idempotency-Key` + different payload → **409 Conflict**.
- **Conflicting attribution:** Different key + conflicting `provider`/`publisher_id` → first claim wins, subsequent claims silently ignored (checkout proceeds).
- **Additive fields:** Non-conflicting fields (e.g., `sub_id`) MAY be merged into existing record.

This behavior ensures checkout is never blocked by attribution conflicts while preventing last-moment hijacking.

### 7.7 Data Retention

Retention of attribution data is implementation-defined. Merchants SHOULD:

- Comply with applicable data protection regulations (e.g., GDPR, CCPA).
- Honor user deletion requests that extend to attribution analytics.
- Delete or redact attribution tokens after settlement is finalized, as tokens may contain time-sensitive cryptographic material.
- Retain only the minimum attribution fields necessary for audit and reconciliation.

### 7.8 Rate Limiting & Abuse

Attribution submissions are subject to the same rate limits as standard ACS endpoints. Merchants MAY additionally:

- Ignore or deprioritize attribution claims from sessions exhibiting suspicious patterns (e.g., rapid create-cancel cycles, multiple conflicting provider claims).
- Flag sessions with attribution claims from unknown or untrusted providers for manual review.
- Implement velocity checks on attribution submissions per agent or IP address.

---

## 8. Backward & Forward Compatibility

### 8.1 Backward compatibility

- `affiliate_attribution` is OPTIONAL.
- Servers that do not support this extension SHOULD ignore the field and proceed with checkout.
- Clients SHOULD only send this field when they believe the server can accept it (e.g., based on `API-Version` or prior integration knowledge).

### 8.2 Forward compatibility

- New fields MAY be added to `affiliate_attribution` in future versions.
- Validators SHOULD be lenient for unknown optional fields within `affiliate_attribution` to avoid version skew.

---

## 9. Required Spec Updates (for implementers)

To implement this RFC, maintainers SHOULD:

- Extend ACS JSON Schemas to include `affiliate_attribution` on the create and complete request objects.
- Extend OpenAPI schemas correspondingly.
- Add examples demonstrating usage.
- Add an entry to `changelog/unreleased.md`.

(Exact file diffs are out of scope for this RFC text.)

---

## 10. Conformance Checklist

An implementation claiming support for **Affiliate Attribution**:

**MUST requirements:**

- [ ] MUST accept `affiliate_attribution` in `POST /checkout_sessions` (first-touch) and `POST /checkout_sessions/{id}/complete` (last-touch).
- [ ] MUST require `affiliate_attribution.provider` when the object is present.
- [ ] MUST require at least one of `{ token, publisher_id }` when the object is present.
- [ ] MUST enforce `metadata` as a flat map of primitive values (no arrays, no nested objects).
- [ ] MUST NOT return `affiliate_attribution` in any read endpoint, including `GET /checkout_sessions/{id}`, list endpoints, and webhook payloads (write-only per Section 4.3.4).
- [ ] MUST ensure idempotency: Replaying a request with the same `Idempotency-Key` and attribution data MUST NOT duplicate the attribution record.
- [ ] MUST return **409 Conflict** when the same `Idempotency-Key` is reused with a different `affiliate_attribution` payload.
- [ ] MUST NOT block checkout due to attribution conflicts; conflicting claims with different/missing `Idempotency-Key` MUST be handled silently.
- [ ] MUST store both first-touch and last-touch attribution when provided at both endpoints.

**SHOULD requirements:**

- [ ] SHOULD treat attribution as write-once: keep the first valid claim, silently ignore subsequent conflicting claims.
- [ ] SHOULD reject payloads containing obvious PII with **400 Bad Request** and code `pii_not_allowed` (Section 6.2).
- [ ] SHOULD avoid logging tokens in plaintext and minimize retention of sensitive fields.
- [ ] SHOULD comply with applicable data protection regulations for attribution data retention.

---

## 11. Change Log

- **2025-12-17**: Initial proposal for affiliate attribution transport via optional `affiliate_attribution` object.
