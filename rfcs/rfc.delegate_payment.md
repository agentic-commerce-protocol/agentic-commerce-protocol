# RFC: Agentic Commerce — Delegate Payment API

**Status:** Draft  
**Version:** 2025-09-29
**Scope:** Delegate payment credential tokenization and controlled usage via allowance constraints

This RFC defines a **single, MUST-implement** HTTP endpoint that issues a **delegated vault token** for a payment credential. The token may then be used by the merchant’s existing PSP **only** within explicit _Allowance_ constraints. Payments, settlement, and compliance remain on the merchant’s rails.

---

## 1. Scope & Goals

- Enable merchants to **safely delegate** a payment credential for use in ChatGPT-initiated checkouts.
- Preserve merchant PSP flows, idempotency, auditability, and risk controls.
- Provide a **stable, versioned** surface (API-Version = `2025-09-29`).

**Out of scope:** PSP-specific authorization/capture, multi-use tokens beyond allowance, refund semantics.

### 1.1 Terminology & Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **MAY** are to be interpreted as described in RFC 2119.

---

## 2. Protocol Phases

### 2.1 Initialization (MUST happen before tokenization)

- **Version compatibility:** Client **MUST** send `API-Version`. Server **MUST** validate support (e.g., `2025-09-29`).
- **Identity proofing requirements:** Server advertises acceptable signature algorithms (e.g., Ed25519, ES256) out-of-band.
- **Implementation details:** Client capabilities (risk signals, wallet types) **SHOULD** be documented or discoverable.
- **Client preparation:** Canonical JSON of request; cryptographic key material for signing.

### 2.2 Preparation & Signing

- Client **MUST** serialize the request using a canonical JSON scheme.
- Client **MUST** compute a detached signature with its private key, **base64url-encode** it, and place it in the `Signature` header.
- Client **MUST** include `Timestamp` (RFC 3339) and **SHOULD** include `Idempotency-Key`.

### 2.3 Tokenize Request

- Client **MUST** issue:
  - **Method:** `POST`
  - **Path:** `/agentic_commerce/delegate_payment`
- **Headers (required unless marked optional):**
  - `Authorization: Bearer <token>` (**REQUIRED**)
  - `Content-Type: application/json` (**REQUIRED**)
  - `Accept-Language: en-us` (OPTIONAL)
  - `User-Agent: <string>` (OPTIONAL)
  - `Idempotency-Key: <string>` (RECOMMENDED)
  - `Request-Id: <string>` (RECOMMENDED)
  - `Signature: <base64url>` (RECOMMENDED; identity verification over canonical request)
  - `Timestamp: <RFC3339>` (RECOMMENDED)
  - `API-Version: 2025-09-29` (**REQUIRED**)

### 2.4 Token Creation & Response

- On success, server **MUST** return `201 Created` with a unique token `id` and `created` timestamp.
- Response **MUST** echo correlation data under `metadata` when applicable (e.g., `merchant_id`, `idempotency_key`).

### 2.5 Usage & Expiry

- The returned token **MUST ONLY** be usable within the provided **Allowance** (reason, max_amount, currency, expiry).
- The token **MUST** become invalid at or after `allowance.expires_at`.

### 2.6 Error Handling

- Errors **MUST** be returned as **flat JSON objects** (no envelope) with fields: `type`, `code`, `message`, optional `param`.
- Servers **SHOULD** use appropriate HTTP status codes:
  - `400/422` invalid request/semantic validation
  - `409` idempotency conflict
  - `429` rate limit
  - `500/503` processing or service unavailable

---

## 3. HTTP Interface

### 3.1 Endpoint

```
POST /agentic_commerce/delegate_payment
```

### 3.2 Request Body (Top-level)

Exactly **one** credential type is supported today: **card**.

| Field             | Type                 | Req | Description                                        |
| ----------------- | -------------------- | :-: | -------------------------------------------------- |
| `payment_method`  | PaymentMethodCard    | ✅  | The credential to tokenize. (type MUST be `card`.) |
| `allowance`       | Allowance            | ✅  | Constraints on how the token may be used.          |
| `billing_address` | Address              | ❌  | Address associated with the payment method.        |
| `risk_signals`    | RiskSignal[]         | ✅  | One or more risk signals.                          |
| `metadata`        | object (map<string>) | ✅  | Arbitrary key/values for correlation.              |

### 3.3 PaymentMethodCard (REQUIRED)

- `type`: **MUST** equal `card`.
- `card_number_type`: `fpan` | `network_token` (**REQUIRED**)
- `virtual`: boolean (**REQUIRED**)
- `number`: string (**REQUIRED**) (FPAN/DPAN/network token/virtual PAN)
- `exp_month`: string (max 2; `"01"`–`"12"`)
- `exp_year`: string (max 4; four-digit year)
- `name`: string
- `cvc`: string (max 4)
- `checks_performed`: array of `avs` | `cvv` | `ani` | `auth0`
- `iin`: string (max 6)
- `display_card_funding_type`: `credit` | `debit` | `prepaid` (**REQUIRED**)
- `display_wallet_type`: string (e.g., wallet indicator for virtual)
- `display_brand`: string (e.g., `visa`, `amex`)
- `display_last4`: string (max 4)
- `metadata`: map<string,string> (**REQUIRED**)

### 3.4 Address (OPTIONAL)

- `name` (≤256), `line_one` (≤60), `line_two` (≤60), `city` (≤60),  
  `state` (ISO-3166-2 where applicable), `country` (ISO-3166-1 alpha-2), `postal_code` (≤20)

### 3.5 Allowance (REQUIRED)

- `reason`: **MUST** be `one_time`
- `max_amount`: integer, minor units (e.g., $20 → `2000`)
- `currency`: string, lowercase ISO-4217 (e.g., `usd`)
- `checkout_session_id`: string
- `merchant_id`: string (≤256)
- `expires_at`: RFC 3339 timestamp

### 3.6 RiskSignal (REQUIRED, one or more)

- `type`: **MUST** be `card_testing`
- `score`: integer
- `action`: `blocked` | `manual_review` | `authorized`

### 3.7 Metadata (REQUIRED)

- Free-form key/value pairs (strings). Store correlation fields (e.g., `source`, `campaign`, `merchant_id`).

---

## 4. Responses

### 4.1 Success — HTTP `201 Created`

**Headers:**

- `Content-Type: application/json`
- `Request-Id: <string>`

**Body:**

```json
{
  "id": "vt_01J8Z3WXYZ9ABC",
  "created": "2025-09-29T11:00:00Z",
  "metadata": {
    "source": "agent_checkout",
    "merchant_id": "acme",
    "idempotency_key": "idem_abc123"
  }
}
```

### 4.2 Error — Flat Object (no envelope)

**Status:** `4xx` / `5xx`  
**Body:**

```json
{
  "type": "invalid_request",
  "code": "invalid_card",
  "message": "Missing/malformed field",
  "param": "payment_method.number"
}
```

**Type & Code Guidelines**

- `type` ∈ `invalid_request`, `rate_limit_exceeded`, `processing_error`, `service_unavailable`
- `code` ∈ `invalid_card`, `duplicate_request`, `idempotency_conflict`
- `param` **SHOULD** be an RFC 9535 JSONPath (when applicable).

---

## 5. Idempotency & Retries

- Clients **SHOULD** provide `Idempotency-Key` for safe retries.
- If the same key is replayed with **different** parameters, server **MUST** return `409` with:
  ```json
  {
    "type": "invalid_request",
    "code": "idempotency_conflict",
    "message": "Same Idempotency-Key used with different parameters"
  }
  ```
- Servers **SHOULD** be tolerant of network timeouts and implement at-least-once processing with idempotency.

---

## 6. Security Considerations

- **Authentication:** `Authorization: Bearer <token>` **MUST** be required.
- **Integrity:** `Signature` over canonical JSON **SHOULD** be verified (algorithm policy advertised out-of-band).
- **Freshness:** `Timestamp` **SHOULD** be required and checked within an acceptable clock-skew window.
- **PII/PCI:** Card data handling **MUST** follow applicable PCI DSS requirements; logs **MUST NOT** contain full PAN or CVC.
- **Transport:** All requests **MUST** use HTTPS/TLS 1.2+.

---

## 7. Validation Rules (non-exhaustive)

- `payment_method.type` **MUST** be `card`.
- `payment_method.card_number_type` ∈ `fpan|network_token`.
- `payment_method.virtual` present (boolean).
- `payment_method.number` present (string).
- When present:
  - `exp_month` length ≤ 2 and value `"01"`–`"12"`.
  - `exp_year` length ≤ 4 and four digits.
  - `cvc` length ≤ 4.
  - `iin` length ≤ 6.
- `display_card_funding_type` ∈ `credit|debit|prepaid`.
- `allowance.currency` matches `^[a-z]{3}$` (e.g., `usd`).
- `allowance.expires_at` must be RFC 3339.
- At least one `risk_signal` item.

---

## 8. Examples

### 8.1 Success (FPAN, one-time allowance)

```json
{
  "payment_method": {
    "type": "card",
    "card_number_type": "fpan",
    "virtual": false,
    "number": "4242424242424242",
    "exp_month": "11",
    "exp_year": "2026",
    "name": "Jane Doe",
    "cvc": "223",
    "checks_performed": ["avs", "cvv"],
    "iin": "424242",
    "display_card_funding_type": "credit",
    "display_brand": "visa",
    "display_last4": "4242",
    "metadata": { "issuing_bank": "temp" }
  },
  "allowance": {
    "reason": "one_time",
    "max_amount": 2000,
    "currency": "usd",
    "checkout_session_id": "csn_01HV3P3...",
    "merchant_id": "acme",
    "expires_at": "2025-10-09T07:20:50.52Z"
  },
  "billing_address": {
    "name": "Ada Lovelace",
    "line_one": "1234 Chat Road",
    "line_two": "",
    "city": "San Francisco",
    "state": "CA",
    "country": "US",
    "postal_code": "94131"
  },
  "risk_signals": [
    { "type": "card_testing", "score": 10, "action": "manual_review" }
  ],
  "metadata": { "campaign": "q4" }
}
```

**201 Created**

```json
{
  "id": "vt_01J8Z3WXYZ9ABC",
  "created": "2025-09-29T11:00:00Z",
  "metadata": {
    "source": "agent_checkout",
    "merchant_id": "acme",
    "idempotency_key": "idem_abc123"
  }
}
```

### 8.2 Error (invalid expiry)

**400 Bad Request**

```json
{
  "type": "invalid_request",
  "code": "invalid_card",
  "message": "Invalid expiry date (exp_month or exp_year)",
  "param": "payment_method.exp_month"
}
```

### 8.3 Error (idempotency conflict)

**409 Conflict**

```json
{
  "type": "invalid_request",
  "code": "idempotency_conflict",
  "message": "Same Idempotency-Key used with different parameters"
}
```

---

## 9. Conformance Checklist

- [ ] Accepts `API-Version` and validates `2025-09-29`
- [ ] Verifies `Authorization` (Bearer)
- [ ] Validates request fields per §3 & §7
- [ ] Enforces **exactly one** credential type (`card`)
- [ ] Honors `Idempotency-Key`; returns `409` on conflict
- [ ] Emits **flat** error object with `type`/`code`/`message`/`param?`
- [ ] Returns `201` with `id`, `created`, and `metadata`
- [ ] Enforces `allowance` constraints and expiry
- [ ] Redacts PCI data in logs/telemetry

---

## 10. Change Log

- **2025-09-29**: Initial draft. Errors changed to **flat object** (no envelope). Tightened allowance and card display requirements.
