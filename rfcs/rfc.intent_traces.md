# RFC: Agentic Checkout — Intent Traces

**Status:** Proposal
**Version:** 2025-12-16
**Scope:** Extension of `POST /cancel` to support structured intent context.

This SEP extends the **Agentic Checkout Specification (ACS)** to support **Intent Tracing**. It defines the request body schema for the cancellation endpoint, enabling agents to transmit structured data regarding _why_ a checkout session was abandoned. This specification lays the groundwork for merchants to transition from probabilistic retargeting (guessing) to deterministic negotiation (bidding).

---

## 1. Motivation

In the current digital economy, cart abandonment is treated as a signal failure. Merchants respond to abandonment with "blind" retargeting—buying ad impressions in the hope of persuading a user to return, without knowing _why_ they left. This is inefficient, costly, and annoying for the user.

**Agentic Commerce** changes this paradigm. When an agent manages the checkout, "abandonment" is no longer a silent exit; it is often a reasoned decision based on specific constraints (e.g., price, shipping speed, brand ethics).

This RFC proposes capturing that decision as an **Intent Trace**. By standardizing this signal, we convert abandonment from a dead end into an actionable data point, where merchants can programmatically respond based on the user's specific objection.

---

## 2. Design Rationale

### 2.1 Why Structured Data?

A free-text cancellation reason would be simpler but less actionable. Structured `reason_code` values enable:

- **Automated routing:** Merchants can trigger different workflows per reason (e.g., `shipping_cost` → offer free shipping promo code).
- **Analytics aggregation:** Standardized codes allow merchants to quantify abandonment causes across sessions.
- **Future extensibility:** A subsequent RFC MAY define **Reconsideration Offers** keyed to specific reason codes.

### 2.2 Why Optional?

The `intent_trace` is optional to maintain backward compatibility. Agents that do not support this extension simply omit the request body, and the cancellation proceeds as before.

### 2.3 Privacy Considerations

Unlike cookie-based retargeting, Intent Traces are:

- **Explicit:** The user's agent transmits intent only when the user chooses to cancel.
- **Scoped:** Data is sent only to the merchant involved in the session, not broadcast to ad networks.
- **Minimal:** The schema encourages structured codes over free-text to reduce PII leakage.

---

## 3. Specification Changes

This RFC modifies the `Cancel Session` endpoint defined in Section 4.5 of the ACS.

### 3.1 Endpoint Update: Cancel Session

**`POST /checkout_sessions/{checkout_session_id}/cancel`**

**Previous Behavior:**

- Request Body: None / Empty
- Response: 200 OK or 405 Method Not Allowed

**New Behavior:**

- **Request Body (Optional):** Clients MAY include an `intent_trace` object in the body with `Content-Type: application/json`. The body signals the reason for cancellation.
- **Processing:** The server SHOULD record this trace for analytics or pricing optimization. The cancellation MUST succeed regardless of whether the server supports or successfully processes the `intent_trace`.
- **Response:** Remains **200 OK**. The response body MUST return the authoritative session state with `status: canceled`.
- **Visibility:** The `intent_trace` is write-only. It is NOT returned in `GET /checkout_sessions/{id}` responses or any other endpoint. Merchants MAY expose trace data through separate audit or analytics feeds outside the scope of this specification.

### 3.2 Schema Definition: Intent Trace

We define a new object `intent_trace` to be passed in the request body.

```json
{
  "intent_trace": {
    "reason_code": "price_sensitivity",
    "trace_summary": "User verified product fit but found a similar SKU on Amazon for $15 less.",
    "metadata": {
      "max_budget": 8500,
      "competitor_source": "amazon_prime",
      "competitor_price": 8499
    }
  }
}
```

### 3.3 Field Definitions & Validation

- `reason_code` (enum, required):

  - `price_sensitivity`: User wants the item but total price is too high.
  - `shipping_cost`: Shipping fees are prohibitive.
  - `shipping_speed`: Delivery date is too late.
  - `product_fit`: User unsure about sizing, compatibility, or product suitability.
  - `trust_security`: User has security or trust concerns about the merchant.
  - `returns_policy`: Return/refund policy is unsatisfactory.
  - `payment_options`: Desired payment method not available.
  - `comparison`: User is actively comparing prices or alternatives across merchants.
  - `timing_deferred`: User intends to purchase but not now. Unlike other codes, this signals "follow up later" rather than an objection the merchant can address immediately.
  - `other`: Fallback for reasons not covered above.

- `trace_summary` (string, optional, max 500 chars): A human-readable summary of the objection.
- `metadata` (object, optional): A flat key-value object for additional context.
  - Keys MUST be strings.
  - Values MUST be strings, numbers, or booleans. Arrays and nested objects are NOT permitted.
  - Monetary values SHOULD be integers in minor units per ACS Section 3.1.
  - Implementations MAY impose limits on key count (e.g., 20 keys) and total payload size.

---

## 4. Example Interaction

### 4.1 Cancel Request (with Intent Trace)

**Request:** `POST /checkout_sessions/cs_123/cancel`

```json
{
  "intent_trace": {
    "reason_code": "shipping_cost",
    "trace_summary": "$10 shipping fee pushes total cost beyond user's budget.",
    "metadata": {
      "target_shipping_cost": 0,
      "competitor_reference": "amazon_prime"
    }
  }
}
```

### 4.2 Cancel Response (200 OK)

The server acknowledges the cancellation and returns the full session state per ACS schema. The `intent_trace` is NOT echoed back; it is stored internally by the merchant.

```json
{
  "id": "cs_123",
  "status": "canceled",
  "currency": "usd",
  "line_items": [
    {
      "id": "line_item_456",
      "item": { "id": "item_789", "quantity": 1 },
      "base_amount": 10000,
      "discount": 0,
      "subtotal": 10000,
      "tax": 0,
      "total": 10000
    }
  ],
  "totals": [
    { "type": "subtotal", "display_text": "Subtotal", "amount": 10000 },
    { "type": "fulfillment", "display_text": "Shipping", "amount": 1000 },
    { "type": "total", "display_text": "Total", "amount": 11000 }
  ],
  "fulfillment_options": [
    {
      "type": "shipping",
      "id": "ship_std",
      "title": "Standard",
      "subtotal": 1000,
      "tax": 0,
      "total": 1000
    }
  ],
  "messages": [
    {
      "type": "info",
      "content_type": "plain",
      "content": "Session canceled."
    }
  ],
  "links": [{ "type": "terms_of_use", "url": "https://merchant.example/terms" }]
}
```

---

## 5. Error Handling

If the `intent_trace` contains **structurally invalid data** (e.g., wrong types, nested objects in `metadata`), the server SHOULD return a **400 Bad Request** adhering to the ACS Error Shape. Note that unrecognized `reason_code` values are NOT errors—see Section 7.2 for forward compatibility rules.

```json
{
  "type": "invalid_request",
  "code": "invalid_type",
  "message": "metadata values must be strings, numbers, or booleans.",
  "param": "$.intent_trace.metadata.nested_object"
}
```

---

## 6. Security & Idempotency

- **Idempotency:** A cancellation request with an `intent_trace` MUST be idempotent. Repeated calls with the same `Idempotency-Key` header and trace data MUST return the same 200 OK response and MUST NOT duplicate the trace record. Clients SHOULD include an `Idempotency-Key` header per ACS Section 2.3.
- **Data Minimization:** Agents SHOULD NOT transmit PII (Personally Identifiable Information) in the `trace_summary` free-text field unless authorized by the user.

---

## 7. Operational Considerations

### 7.1 Backward Compatibility

Servers that do not implement Intent Traces MUST still accept and process cancellation requests that include an `intent_trace` body. The server SHOULD ignore the unrecognized body and proceed with cancellation, returning 200 OK with `status: canceled`. Some HTTP frameworks reject unexpected request bodies on endpoints that previously accepted none—implementers should ensure their routing layer permits optional bodies on this endpoint.

### 7.2 Forward Compatibility

If a server receives an unrecognized `reason_code` (e.g., from a newer client), it SHOULD accept the trace and treat the unknown code as equivalent to `other` for processing purposes. This ensures cancellation is not blocked by version skew.

**Implementation Note:** The `reason_code` enum in the OpenAPI and JSON Schema specifications lists known values but is explicitly extensible. Implementations SHOULD configure validators for lenient enum handling to avoid rejecting valid requests containing reason codes added in newer specification versions. The enum exists for documentation and tooling support, not as a strict validation constraint.

### 7.3 Rate Limiting

Intent Traces are subject to the same rate limits as standard ACS endpoints. Merchants MAY additionally ignore or deprioritize traces from sessions exhibiting suspicious patterns (e.g., rapid create-cancel cycles).

### 7.4 Data Retention

Retention of intent trace data is implementation-defined. Merchants SHOULD comply with applicable data protection regulations (e.g., GDPR, CCPA) and honor user deletion requests that extend to abandonment analytics.

---

## 8. Conformance Checklist

To claim compliance with the **Intent Traces** extension, a merchant implementation:

- [ ] **MUST** accept the `intent_trace` object in the body of `POST /checkout_sessions/{id}/cancel` with `Content-Type: application/json`.
- [ ] **MUST** accept `metadata` as a flat object with string, number, or boolean values only (no arrays or nested objects).
- [ ] **MUST** ensure idempotency: Replaying a cancel request with the same `Idempotency-Key` and trace data MUST NOT duplicate the trace record.
- [ ] **MUST NOT** return `intent_trace` data in `GET /checkout_sessions/{id}` responses (write-only).
- [ ] **SHOULD** accept unrecognized `reason_code` values and treat them as `other` (forward compatibility per Section 7.2).
- [ ] **SHOULD** return a `400 Bad Request` with type `invalid_request` only for structurally malformed data (e.g., wrong types, nested objects in `metadata`). Unknown `reason_code` values are NOT errors.
- [ ] **SHOULD** comply with applicable data protection regulations for trace data retention.
- [ ] **SHOULD NOT** log or store PII from `trace_summary` unless explicitly authorized.

For servers that do NOT implement this extension, see Section 7.1 (Backward Compatibility).

---

## 9. Change Log

- **2025-12-16**: Initial proposal for Intent Traces. Defined `intent_trace` schema with flexible `metadata` object. Enum values based on [Baymard Institute cart abandonment research](https://baymard.com/lists/cart-abandonment-rate).
