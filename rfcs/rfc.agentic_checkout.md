# RFC: Agentic Checkout — Merchant REST API

**Status:** Draft  
**Version:** 2026-01-16  
**Scope:** Checkout session lifecycle and webhook integration

This RFC defines the **Agentic Checkout Specification (ACS)**, a standardized REST API contract that merchants SHOULD implement to support experiences across agent platforms.

The merchant remains the **system of record** for all orders, payments, taxes, and compliance.  
This specification ensures that:

- Orders are processed entirely on the merchant’s existing commerce stack.
- Payment authorization and settlement continue to occur via the merchant’s PSP.

---

## 1. Scope & Goals

- Provide a **stable, versioned** API surface (`API-Version: 2026-01-16`) that ChatGPT calls to create, update, retrieve, complete, and cancel checkout sessions.
- Ensure ChatGPT renders an **authoritative cart state** on every response.
- Keep **payments on merchant rails**; optional delegated payments are covered separately.
- Support **safe retries** via idempotency and **strong security** via authentication and request signing.

**Out of scope:** PSP authorization/capture semantics, returns/exchanges workflows, tax configuration, fraud modeling details.

### 1.1 Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **MAY** follow RFC 2119/8174.

---

## 2. Protocol Phases

### 2.1 Initialization

- **Versioning:** Client (ChatGPT) **MUST** send `API-Version`. Server **MUST** validate support (e.g., `2026-01-16`).
  - When rejecting a request due to missing or unsupported `API-Version` header, servers **SHOULD** return HTTP `400 Bad Request` with a `supported_versions` array listing all versions the server accepts. Servers **MAY** use `unsupported_api_version` or `missing_api_version` as well-known `code` values.
- **Identity/Signing:** Server **SHOULD** publish acceptable signature algorithms out‑of‑band; client **SHOULD** sign requests (`Signature`) over canonical JSON with an accompanying `Timestamp` (RFC 3339).
- **Capabilities:** Merchant **SHOULD** document accepted payment methods (e.g., `card`) and fulfillment types (`shipping`, `digital`).

### 2.2 Session Lifecycle

1. **Create** — `POST /checkout_sessions` initializes a session from items and optional buyer/address.
2. **Update** — `POST /checkout_sessions/{id}` applies changes (items, address, fulfillment option).
3. **Retrieve** — `GET /checkout_sessions/{id}` returns latest authoritative state.
4. **Complete** — `POST /checkout_sessions/{id}/complete` finalizes with a payment method and **MUST** create an order.
5. **Cancel** — `POST /checkout_sessions/{id}/cancel` cancels if the session is not yet completed/canceled.

### 2.3 Webhooks (Separate Spec)

Order lifecycle updates (`order_create`, `order_update`) **MUST** be emitted to the application’s webhook receiver (see **Agentic Checkout Webhooks API** RFC/OAS).

---

## 3. HTTP Interface

### 3.1 Common Requirements

All endpoints **MUST** use HTTPS and return JSON. Amounts **MUST** be integers in minor units.

**Request Headers (sent by ChatGPT unless noted):**

- `Authorization: Bearer <token>` (**REQUIRED**)
- `Content-Type: application/json` (**REQUIRED** on requests with body)
- `Accept-Language: <locale>` (e.g., `en-US`) (**RECOMMENDED**)
- `User-Agent: <string>` (**RECOMMENDED**)
- `Idempotency-Key: <string>` (**REQUIRED** on all POST requests; opaque string, max 255 characters, UUID v4 recommended)
- `Request-Id: <string>` (**RECOMMENDED**)
- `Signature: <base64url>` (**RECOMMENDED**)
- `Timestamp: <RFC3339>` (**RECOMMENDED**)
- `API-Version: 2026-01-16` (**REQUIRED**)

**Response Headers:**

- `Idempotency-Key` — echo on all POST responses
- `Request-Id` — echo if provided

**Error Shape (flat):**

```json
{
  "type": "invalid_request",
  "code": "invalid",
  "message": "Description",
  "param": "$.line_items[0].quantity"
}
```

Where `type` ∈ `invalid_request | processing_error | service_unavailable`. `param` is an RFC 9535 JSONPath (optional).

---

## 4. Endpoints

### 4.1 Create Session

`POST /checkout_sessions` → **201 Created**

**Request body (subset):**

```json
{
  "items": [{ "id": "item_123", "quantity": 1 }],
  "buyer": {
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com"
  },
  "fulfillment_details": {
    "name": "John Smith",
    "phone_number": "15551234567",
    "email": "john@example.com",
    "address": {
      "name": "John Smith",
      "line_one": "1234 Chat Road",
      "line_two": "",
      "city": "San Francisco",
      "state": "CA",
      "country": "US",
      "postal_code": "94102"
    }
  }
}
```

**Response body (authoritative cart):**

- `id` (string)
- `capabilities.payment.handlers` (array of **PaymentHandler** objects with handler config, PSP, and requirements)
- `status`: `not_ready_for_payment | ready_for_payment | completed | canceled | in_progress`
- `currency` (ISO 4217, e.g., `usd`)
- `line_items[]` with `base_amount`, `discount`, `subtotal`, `tax`, `total` (all **integers**)
- `fulfillment_details` (with `name`, `phone`, `email`, and nested `address`)
- `fulfillment_options[]` (shipping/digital) with integer costs and optional delivery windows
- `selected_fulfillment_options[]` (array of selected options with type and item mappings)
- `totals[]` each with integer `amount`
- `messages[]` (`info` / `error` entries)
- `links[]` policy URLs
- `authentication_metadata` (optional seller-provided metadata required for 3D Secure flows)
- `order` (on complete, with `id`, `checkout_session_id`, `permalink_url`)

### 4.2 Update Session

`POST /checkout_sessions/{checkout_session_id}` → **200 OK**  
Body may include `items`, `fulfillment_details`, or `selected_fulfillment_options`. Response returns full authoritative state as in **Create**.

### 4.3 Retrieve Session

`GET /checkout_sessions/{checkout_session_id}` → **200 OK** (or **404** if not found)  
Returns the full authoritative session state.

### 4.4 Complete Session

`POST /checkout_sessions/{checkout_session_id}/complete` → **200 OK** on success  
Body includes `payment_data` (e.g., delegated token + optional billing address) and optional `buyer`, and conditional `authentication_result`. 
Response **MUST** include `status: completed` and an `order` with `id`, `checkout_session_id`, and `permalink_url`.

Authentication flows and additional fields:
- Server MUST set `session.status` to `authentication_required` when authentication (e.g., 3DS) is required.
- When status is `authentication_required`, the client MUST attempt authentication using the provided metadata and MUST return the `authentication_result` in the `POST /complete` request body, regardless of the authentication outcome.

If a client calls `POST .../complete` while `session.status` is `authentication_required` and does not include `authentication_result`:
- Server MUST return a 4XX error.
- Server MUST set type to `invalid_request`, code to `requires_3ds`, and param to `$.authentication_result`.

### 4.5 Cancel Session

`POST /checkout_sessions/{checkout_session_id}/cancel` → **200 OK** when canceled, **405** if already `completed` or `canceled`.

---

## 5. Data Model (authoritative extract)

- **Item**: `id` (string), `quantity` (int ≥ 1)
- **LineItem**: `id`, `item`, `base_amount`, `discount`, `subtotal`, `tax`, `total` (**int**), `name?` (string), `description?` (string), `images?` (array of URI strings), `unit_amount?` (**int**), `disclosures?` (array of **Disclosure**), `custom_attributes?` (array of **CustomAttribute**), `marketplace_seller_details?` (**MarketplaceSellerDetails**)
- **Disclosure**: `type` (`disclaimer`), `content_type` (`plain | markdown`), `content` (string)
- **CustomAttribute**: `display_name` (string), `value` (string)
- **MarketplaceSellerDetails**: `name` (string)
- **Total**: `type` (`items_base_amount | items_discount | subtotal | discount | fulfillment | tax | fee | total`), `display_text`, `amount` (**int**), `description?` (optional string for fees)
- **Address**: `name`, `line_one`, `line_two?`, `city`, `state`, `country`, `postal_code`
- **FulfillmentDetails**: `name?`, `phone?`, `email?`, `address?` (nested Address object)
- **FulfillmentOption (shipping)**: `id`, `title`, `description?`, `carrier?`, `earliest_delivery_time?`, `latest_delivery_time?`, `totals` (array of **Total**)
- **FulfillmentOption (digital)**: `id`, `title`, `description?`, `totals` (array of **Total**)
- **FulfillmentOption (pickup)**: `id`, `title`, `description?`, `location`, `pickup_type?`, `ready_by?`, `pickup_by?`, `totals` (array of **Total**)
- **FulfillmentOption (local_delivery)**: `id`, `title`, `description?`, `delivery_window?`, `service_area?`, `totals` (array of **Total**)
- **SelectedFulfillmentOption**: `type` (`shipping|digital|pickup|local_delivery`), `option_id`, `item_ids[]` (simple object mapping fulfillment option to items)
- **PaymentHandler**: `id`, `name`, `version`, `spec`, `requires_delegate_payment`, `requires_pci_compliance`, `psp`, `config_schema`, `instrument_schemas[]`, `config` (handler-specific configuration)
- **PaymentData**: `handler_id`, `instrument` (with `type` and `credential`), `billing_address?`
- **Order**: `id`, `checkout_session_id`, `permalink_url`
- **Message (info)**: `type: "info"`, `severity?`, `resolution?`, `param?`, `content_type: "plain"|"markdown"`, `content`
- **Message (warning)**: `type: "warning"`, `code`, `severity?`, `resolution?`, `param?`, `content_type`, `content`
- **Message (error)**: `type: "error"`, `code` (`missing|invalid|out_of_stock|payment_declined|requires_sign_in|requires_3ds`), `severity?`, `resolution?`, `param?`, `content_type`, `content`

Message resolution values:
- `resolution` (optional): Declares who resolves this message. Values:
  - `recoverable`: Agent can fix via API (e.g., retry with different parameters)
  - `requires_buyer_input`: Buyer must provide information the API cannot collect programmatically
  - `requires_buyer_review`: Buyer must authorize before order placement (policy, regulatory, or entitlement rules)
- **Link**: `type` (`terms_of_use|privacy_policy|return_policy`), `url`
- **Total**: `type`, `display_text`, `amount` (**int**), `description?`

3D Secure / Authentication-specific types:
- **AuthenticationMetadata**:
  - `acquirer_details` (object): `acquirer_bin`, `acquirer_country`, `acquirer_merchant_id`, `merchant_name`, `requestor_id?`.
  - `directory_server`: enum `american_express` | `mastercard` | `visa`.
  - `flow_preference?` (object): `type` ("challenge" | "frictionless"), `challenge?` (object), `frictionless?` (object).
- **AuthenticationResult**: `outcome` (enum), `outcome_details?` (object containing `three_ds_cryptogram`, `electronic_commerce_indicator`, `transaction_id`, `version`).

All money fields are **integers (minor units)**.

---

## 6. Idempotency, Retries & Concurrency

> Canonical reference for ACP idempotency. Supersedes prior idempotency rules where they conflict. See SEP #120.

### 6.1 Idempotency-Key Requirement

- Clients **MUST** include an `Idempotency-Key` header on **every POST** request (create, update, complete, cancel).
- The key is an **opaque string**, max **255 characters**; UUID v4 is **RECOMMENDED**.
- Servers **MUST** scope keys to the **authenticated identity + endpoint path**; the same key on different endpoints is treated independently.
- A POST request **without** an `Idempotency-Key` header **MUST** be rejected with:
  ```json
  {
    "type": "invalid_request",
    "code": "idempotency_key_required",
    "message": "Idempotency-Key header is required on all POST requests"
  }
  ```
  HTTP status: **400 Bad Request**.

### 6.2 Request Equivalence

- Equivalence is determined by **semantic JSON equality of the request body only**; headers are excluded.
- Servers **MUST** treat the following as equivalent:
  | Variation | Equivalent? |
  |---|---|
  | Different key ordering | Yes |
  | `null` value vs absent key | **Different** — `null` means "clear this field"; absent means "do not modify" |
  | Trailing zeros in numbers (`1.0` vs `1`) | Yes |
  | Array element ordering | **No** — arrays are order-sensitive |
- Monetary values **SHOULD** use **string** or **integer-cent** representations to avoid floating-point ambiguity.
- _Informative:_ Servers **MAY** implement comparison via RFC 8785 (JCS) canonicalization + SHA-256 fingerprint.

### 6.3 Replay Behavior

- Same key + **identical** body → server **MUST** return the **original response** with the **same HTTP status code**.
- The replayed response **SHOULD** include the header `Idempotent-Replayed: true`.
- **Update endpoints** (`POST /checkout_sessions/{id}`) follow the same replay semantics as create: same key + same body returns the stored response.
- Servers **MUST NOT** re-execute side effects (e.g., payment capture, inventory reservation) on replay.

### 6.4 Error Responses

All idempotency errors use `type: "invalid_request"` and the following codes:

| Scenario | HTTP | `code` | Retryable? |
|---|---|---|---|
| Missing `Idempotency-Key` header | 400 | `idempotency_key_required` | Yes (add header) |
| Same key, different body | 422 | `idempotency_conflict` | **No** (permanent) |
| Same key, original request still in flight | 409 | `idempotency_in_flight` | Yes (honor `Retry-After`) |

- **422 — payload mismatch** example:
  ```json
  {
    "type": "invalid_request",
    "code": "idempotency_conflict",
    "message": "Idempotency-Key has already been used with a different request body"
  }
  ```
- **409 — in-flight collision** example:
  ```json
  {
    "type": "invalid_request",
    "code": "idempotency_in_flight",
    "message": "A request with this Idempotency-Key is currently being processed"
  }
  ```
  Servers **SHOULD** include a `Retry-After` header (in seconds).

### 6.5 Server Error Caching

- Responses with HTTP **5xx** status codes **MUST NOT** be cached against the idempotency key.
- A retry with the same key after a 5xx **MUST** be processed as a **fresh request**.

### 6.6 Key Retention

- Servers **MUST** retain idempotency key → response mappings for **at least 24 hours**.
- After expiry, a reused key is treated as a **new request** (no error).

### 6.7 Extension Fields

- When an ACP extension is active, extension-defined fields in the request body **MUST** participate in body comparison (§6.2).

### 6.8 Implementation Guidance (informative)

- **Gateway / middleware pattern:** Idempotency logic is **RECOMMENDED** to live in a middleware layer in front of business logic, so all endpoints gain consistent behavior.
- **Atomic transaction boundaries:** The idempotency key record and the business operation **SHOULD** be committed in the **same ACID transaction** to prevent ghost keys (key stored, operation failed) or lost keys (operation succeeded, key not stored).
- **Recovery points:** When an operation triggers foreign state mutations (e.g., PSP authorization), servers **SHOULD** implement recovery-point semantics — record intermediate state so that retries can resume rather than restart.
- **SDK serialization:** Because `null` and absent are semantically distinct (§6.2), SDK authors **SHOULD** ensure their serializers preserve the distinction. Clients **MUST** only include `null` when they intend to clear a field, and **MUST** omit the key when they intend to leave the field unchanged.

---

## 7. Security Considerations

- **Authentication:** `Authorization: Bearer <token>` **REQUIRED**.
- **Integrity & Freshness:** `Signature` over canonical JSON and `Timestamp` **SHOULD** be verified with a bounded clock‑skew window.
- **PCI/PII:** Do not log full PAN/CVC; redact addresses as required by policy. TLS 1.3 **MUST** be used.
- **Webhooks:** Verify HMAC (`Merchant-Signature`) on webhook calls (see separate Webhooks RFC/OAS).

---

## 8. Validation Rules (non‑exhaustive)

- `currency` is ISO‑4217 (lowercase recommended, e.g., `usd`).
- All monetary amounts are **integers** (minor units).
- `status` ∈ `not_ready_for_payment | ready_for_payment | completed | canceled | in_progress`.
- At least one `Total` with `type: "total"` **SHOULD** be present when calculable.
- `selected_fulfillment_options[].option_id` **MUST** match an element of `fulfillment_options` when set.
- `messages[].param` **SHOULD** be an RFC 9535 JSONPath when applicable.
- When status is `authentication_required`, the session response MUST include `authentication_metadata`.

---

## 9. Examples (minor units)

### 9.1 Create — Request

```json
{
  "items": [{ "id": "item_456", "quantity": 1 }],
  "fulfillment_details": {
    "name": "test",
    "phone_number": "15551234567",
    "email": "test@example.com",
    "address": {
      "name": "test",
      "line_one": "1234 Chat Road",
      "line_two": "",
      "city": "San Francisco",
      "state": "CA",
      "country": "US",
      "postal_code": "94131"
    }
  }
}
```

### 9.2 Create — Response (201)

```json
{
  "id": "checkout_session_123",
  "payment": {
    "handlers": [
      {
        "id": "card_tokenized",
        "name": "dev.acp.tokenized.card",
        "version": "2026-01-22",
        "spec": "https://acp.dev/handlers/tokenized.card",
        "requires_delegate_payment": true,
        "requires_pci_compliance": false,
        "psp": "stripe",
        "config_schema": "https://acp.dev/schemas/handlers/tokenized.card/config.json",
        "instrument_schemas": ["https://acp.dev/schemas/handlers/tokenized.card/instrument.json"],
        "config": {
          "merchant_id": "acct_1234567890",
          "psp": "stripe",
          "accepted_brands": ["visa", "mastercard", "amex", "discover"],
          "supports_3ds": true,
          "environment": "production"
        }
      }
    ]
  },
  "status": "ready_for_payment",
  "currency": "usd",
  "line_items": [
    {
      "id": "line_item_456",
      "item": { "id": "item_456", "quantity": 1 },
      "base_amount": 300,
      "discount": 0,
      "subtotal": 300,
      "tax": 30,
      "total": 330
    }
  ],
  "fulfillment_details": {
    "name": "test",
    "phone_number": "15551234567",
    "email": "test@example.com",
    "address": {
      "name": "test",
      "line_one": "1234 Chat Road",
      "line_two": "",
      "city": "San Francisco",
      "state": "CA",
      "country": "US",
      "postal_code": "94131"
    }
  },
  "selected_fulfillment_options": [
    {
      "type": "shipping",
      "option_id": "fulfillment_option_123",
      "item_ids": ["item_456"]
    }
  ],
  "totals": [
    {
      "type": "items_base_amount",
      "display_text": "Item(s) total",
      "amount": 300
    },
    { "type": "subtotal", "display_text": "Subtotal", "amount": 300 },
    { "type": "tax", "display_text": "Tax", "amount": 30 },
    { "type": "fulfillment", "display_text": "Fulfillment", "amount": 100 },
    { "type": "total", "display_text": "Total", "amount": 430 }
  ],
  "fulfillment_options": [
    {
      "type": "shipping",
      "id": "fulfillment_option_123",
      "title": "Standard",
      "description": "Arrives in 4-5 days",
      "carrier": "USPS",
      "earliest_delivery_time": "2025-10-12T07:20:50.52Z",
      "latest_delivery_time": "2025-10-13T07:20:50.52Z",
      "totals": [
        { "type": "total", "display_text": "Shipping", "amount": 100 }
      ]
    },
    {
      "type": "shipping",
      "id": "fulfillment_option_456",
      "title": "Express",
      "description": "Arrives in 1-2 days",
      "carrier": "USPS",
      "earliest_delivery_time": "2025-10-09T07:20:50.52Z",
      "latest_delivery_time": "2025-10-10T07:20:50.52Z",
      "totals": [
        { "type": "total", "display_text": "Express Shipping", "amount": 500 }
      ]
    }
  ],
  "messages": [],
  "links": [
    {
      "type": "terms_of_use",
      "url": "https://www.testshop.com/legal/terms-of-use"
    }
  ]
}
```

### 9.3 Update — Request

```json
{
  "selected_fulfillment_options": [
    {
      "option_id": "fulfillment_option_456",
      "item_ids": ["item_456"]
    }
  ]
}
```

### 9.4 Update — Response (200)

```json
{
  "id": "checkout_session_123",
  "status": "ready_for_payment",
  "currency": "usd",
  "line_items": [
    {
      "id": "line_item_456",
      "item": { "id": "item_456", "quantity": 1 },
      "base_amount": 300,
      "discount": 0,
      "subtotal": 300,
      "tax": 30,
      "total": 330
    }
  ],
  "fulfillment_details": {
    "name": "test",
    "phone_number": "15551234567",
    "email": "test@example.com",
    "address": {
      "name": "test",
      "line_one": "1234 Chat Road",
      "line_two": "",
      "city": "San Francisco",
      "state": "CA",
      "country": "US",
      "postal_code": "94131"
    }
  },
  "selected_fulfillment_options": [
    {
      "option_id": "fulfillment_option_456",
      "item_ids": ["item_456"]
    }
  ],
  "totals": [
    {
      "type": "items_base_amount",
      "display_text": "Item(s) total",
      "amount": 300
    },
    { "type": "subtotal", "display_text": "Subtotal", "amount": 300 },
    { "type": "tax", "display_text": "Tax", "amount": 30 },
    { "type": "fulfillment", "display_text": "Fulfillment", "amount": 500 },
    { "type": "total", "display_text": "Total", "amount": 830 }
  ],
  "fulfillment_options": [
    {
      "type": "shipping",
      "id": "fulfillment_option_123",
      "title": "Standard",
      "description": "Arrives in 4-5 days",
      "carrier": "USPS",
      "earliest_delivery_time": "2025-10-12T07:20:50.52Z",
      "latest_delivery_time": "2025-10-13T07:20:50.52Z",
      "totals": [
        { "type": "total", "display_text": "Shipping", "amount": 100 }
      ]
    },
    {
      "type": "shipping",
      "id": "fulfillment_option_456",
      "title": "Express",
      "description": "Arrives in 1-2 days",
      "carrier": "USPS",
      "earliest_delivery_time": "2025-10-09T07:20:50.52Z",
      "latest_delivery_time": "2025-10-10T07:20:50.52Z",
      "totals": [
        { "type": "total", "display_text": "Express Shipping", "amount": 500 }
      ]
    }
  ],
  "messages": [],
  "links": [
    {
      "type": "terms_of_use",
      "url": "https://www.testshop.com/legal/terms-of-use"
    }
  ]
}
```

### 9.5 Complete — Request

```json
{
  "buyer": {
    "first_name": "John",
    "last_name": "Smith",
    "email": "johnsmith@mail.com",
    "phone_number": "15552003434"
  },
  "payment_data": {
    "handler_id": "card_tokenized",
    "instrument": {
      "type": "card",
      "credential": {
        "type": "spt",
        "token": "spt_123"
      }
    },
    "billing_address": {
      "name": "test",
      "line_one": "1234 Chat Road",
      "line_two": "",
      "city": "San Francisco",
      "state": "CA",
      "country": "US",
      "postal_code": "94131"
    }
  },
  "authentication_result": {
    "outcome": "authenticated",
    "outcome_details": {
      "three_ds_cryptogram": "AbCdEfGhIjKlMnOpQrStUvWxY0=",
      "electronic_commerce_indicator": "05",
      "transaction_id": "dsTransId_abc123",
      "version": "2.2.0"
    }
  }
}
```

If the session is in `authentication_required` state, a client MUST include `authentication_result` appropriate to the session's `authentication_metadata` (see Data Model). If not included, servers MUST respond with a 4XX error as described below.

### 9.6 Complete — Response (200)

```json
{
  "id": "checkout_session_123",
  "buyer": {
    "first_name": "John",
    "last_name": "Smith",
    "email": "johnsmith@mail.com",
    "phone_number": "15552003434"
  },
  "status": "completed",
  "currency": "usd",
  "line_items": [
    {
      "id": "line_item_456",
      "item": { "id": "item_456", "quantity": 1 },
      "base_amount": 300,
      "discount": 0,
      "subtotal": 300,
      "tax": 30,
      "total": 330
    }
  ],
  "fulfillment_details": {
    "name": "test",
    "phone_number": "15551234567",
    "email": "test@example.com",
    "address": {
      "name": "test",
      "line_one": "1234 Chat Road",
      "line_two": "",
      "city": "San Francisco",
      "state": "CA",
      "country": "US",
      "postal_code": "94131"
    }
  },
  "selected_fulfillment_options": [
    {
      "type": "shipping",
      "option_id": "fulfillment_option_456",
      "item_ids": ["item_456"]
    }
  ],
  "totals": [
    {
      "type": "items_base_amount",
      "display_text": "Item(s) total",
      "amount": 300
    },
    { "type": "subtotal", "display_text": "Subtotal", "amount": 300 },
    { "type": "tax", "display_text": "Tax", "amount": 30 },
    { "type": "fulfillment", "display_text": "Fulfillment", "amount": 500 },
    { "type": "total", "display_text": "Total", "amount": 830 }
  ],
  "fulfillment_options": [
    {
      "type": "shipping",
      "id": "fulfillment_option_123",
      "title": "Standard",
      "description": "Arrives in 4-5 days",
      "carrier": "USPS",
      "earliest_delivery_time": "2025-10-12T07:20:50.52Z",
      "latest_delivery_time": "2025-10-13T07:20:50.52Z",
      "totals": [
        { "type": "total", "display_text": "Shipping", "amount": 100 }
      ]
    },
    {
      "type": "shipping",
      "id": "fulfillment_option_456",
      "title": "Express",
      "description": "Arrives in 1-2 days",
      "carrier": "USPS",
      "earliest_delivery_time": "2025-10-09T07:20:50.52Z",
      "latest_delivery_time": "2025-10-10T07:20:50.52Z",
      "totals": [
        { "type": "total", "display_text": "Express Shipping", "amount": 500 }
      ]
    }
  ],
  "messages": [],
  "links": [
    {
      "type": "terms_of_use",
      "url": "https://www.testshop.com/legal/terms-of-use"
    }
  ],
  "order": {
    "id": "ord_abc123",
    "checkout_session_id": "checkout_session_123",
    "permalink_url": "https://example.com/orders/ord_abc123"
  }
}
```

### 9.7 Complete — 400 Example (requires authentication_result)

If a client calls `POST /checkout_sessions/{id}/complete` while `session.status == "authentication_required"` and does not provide `authentication_result`, servers MUST return a 4XX response using the Error schema. Example:

```json
{
  "type": "invalid_request",
  "code": "requires_3ds",
  "message": "This checkout session requires issuer authentication. The request must include 'authentication_result'.",
  "param": "$.authentication_result"
}
```

### 9.8 Cancel — Response (200)

```json
{
  "id": "checkout_session_123",
  "status": "canceled",
  "currency": "usd",
  "line_items": [
    {
      "id": "line_item_456",
      "item": { "id": "item_456", "quantity": 1 },
      "base_amount": 300,
      "discount": 0,
      "subtotal": 300,
      "tax": 30,
      "total": 330
    }
  ],
  "totals": [
    {
      "type": "items_base_amount",
      "display_text": "Item(s) total",
      "amount": 300
    },
    { "type": "subtotal", "display_text": "Subtotal", "amount": 300 },
    { "type": "tax", "display_text": "Tax", "amount": 30 },
    { "type": "fulfillment", "display_text": "Fulfillment", "amount": 500 },
    { "type": "total", "display_text": "Total", "amount": 830 }
  ],
  "messages": [
    {
      "type": "info",
      "content_type": "plain",
      "content": "Checkout session has been canceled."
    }
  ],
  "links": [
    {
      "type": "terms_of_use",
      "url": "https://www.testshop.com/legal/terms-of-use"
    }
  ]
}
```

---

## 10. Conformance Checklist

- [ ] Enforces HTTPS, JSON, and `API-Version: 2026-01-15`
- [ ] Returns **authoritative** cart state on every response
- [ ] Uses **integer** minor units for all monetary amounts
- [ ] Implements create, update (POST), retrieve (GET), complete, cancel
- [ ] Requires `Idempotency-Key` on all POST; returns 400/422/409 per §6
- [ ] Emits flat error objects with `type/code/message/param?`
- [ ] Verifies auth; signs/verifies requests where applicable
- [ ] Emits order webhooks per the Webhooks RFC (separate spec)
- [ ] Uses `fulfillment_details` with nested structure (not flat `fulfillment_address`)
- [ ] Uses `selected_fulfillment_options[]` array (not singular `fulfillment_option_id`)
- [ ] Makes `subtotal` and `tax` optional in `FulfillmentOption` schemas

---

## 11. Change Log

- **Unreleased**: Rewrote §6 (Idempotency, Retries & Concurrency) with full normative rules: mandatory `Idempotency-Key` on all POST requests, request equivalence semantics, replay behavior with `Idempotent-Replayed` header, IETF-aligned error codes (`idempotency_key_required`, `idempotency_conflict`, `idempotency_in_flight`), 5xx caching prohibition, 24-hour key retention, and extension field participation. Removed `request_not_idempotent` from `Error.type` enum. See SEP #120.
- **2026-02-04**: Added optional `resolution` field to Message schemas (info, warning, error) to indicate who resolves the message (`recoverable`, `requires_buyer_input`, `requires_buyer_review`). This enables agents to programmatically determine appropriate error handling strategies.
- **2026-01-12**: Breaking changes for v2:
  - Renamed `fulfillment_address` to `fulfillment_details` with nested structure (`name`, `phone_number`, `email`, `address`)
  - Replaced `fulfillment_option_id` with `selected_fulfillment_options[]` array supporting multiple selections and item mappings
  - Made `subtotal` and `tax` optional in `FulfillmentOption` (both shipping and digital)
  - Added `selected_fulfillment_options` to `UpdateCheckoutRequest`
  - Added `order` details to complete response (already present but now explicitly documented)
- **2025-09-12**: Initial draft; clarified **integer amount** requirement; separated webhooks into dedicated spec.
- **2026-01-16**: Added 3D Secure/authentication flow support 
