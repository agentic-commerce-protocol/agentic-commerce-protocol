# RFC: Agentic Commerce — Cart

**Status:** Proposal
**Version:** unreleased
**Scope:** Pre-checkout basket building for the Agentic Commerce Protocol

This RFC introduces a **Cart** capability for the Agentic Commerce Protocol (ACP). Carts provide a lightweight CRUD interface for item collection before purchase intent is established, enabling incremental basket building, estimated pricing, and session persistence without the overhead of a full checkout lifecycle.

---

## 1. Motivation

ACP's checkout session (`POST /checkout_sessions`) is designed for purchase finalization: it triggers capability negotiation, payment handler configuration, status lifecycle management, and authoritative pricing. This is the right model once a buyer has expressed purchase intent, but it is heavyweight for the common agent interaction pattern of incremental basket building.

Agents frequently build baskets iteratively:

1. "Add the blue running shoes to my cart"
2. "Also add two pairs of socks"
3. "Actually, remove the socks"
4. "What's my estimated total?"
5. "Okay, let's check out"

Without a cart, the agent must either:

- **Create a checkout session on the first item** — which triggers full capability negotiation, payment handler setup, and status lifecycle for what is essentially a browsing action. Every item change is a checkout update that returns authoritative (not estimated) totals.
- **Track items client-side** — which means the seller has no visibility into browsing behavior, cannot provide estimated pricing, and cannot validate item availability until checkout.

Neither approach serves agents or sellers well.

### What a Cart provides

- **Lightweight item management**: CRUD operations on a basket without payment configuration or status lifecycle.
- **Estimated pricing**: Sellers return estimated totals (subtotal, tax where calculable, total) without requiring full address or payment information.
- **Session persistence**: Carts survive across agent sessions, enabling "save for later" and multi-session shopping.
- **Sharing and handoff**: A `continue_url` enables cart sharing between agents and human-in-the-loop flows.
- **Seller visibility**: Sellers see browsing behavior (items added/removed) before checkout, enabling analytics and personalization.
- **Clean separation of concerns**: Cart handles basket building; checkout handles purchase finalization. The boundary is explicit.

---

## 2. Goals and Non-Goals

### 2.1 Goals

1. **Simple CRUD**: Create, read, update, and cancel carts with minimal required fields.
2. **Reuse existing types**: Cart line items, buyer, totals, and messages reuse existing ACP types — no new domain concepts.
3. **Estimated totals**: Sellers provide best-effort pricing estimates. Totals are explicitly non-authoritative until checkout.
4. **Optional capability**: Cart is an optional ACP service. Sellers MAY implement it. Agents MUST NOT assume cart support.

> **Deferred to follow-up SEPs:** Cart-to-checkout conversion via a `cart_id` field on `CheckoutSessionCreateRequest`, and extension support (e.g., discount codes during browsing) are intentionally deferred. This SEP establishes the core cart resource; conversion and extension semantics will build on it additively.

### 2.2 Non-Goals

- **Payment handling**: Carts do not carry payment data or payment handlers. Payment is a checkout concern.
- **Status lifecycle**: Carts do not have a status state machine. A cart either exists or it does not.
- **Capability negotiation**: Carts do not carry a `capabilities` object. Capability negotiation occurs at checkout creation time.
- **Fulfillment option selection**: Carts do not support fulfillment option selection. Fulfillment options are presented and selected during checkout.
- **Order creation**: Carts cannot be completed or converted to orders directly.
- **Cart-to-checkout bridge**: Automatic conversion of carts to checkout sessions via a `cart_id` field is deferred to a follow-up SEP. Agents can manually create checkout sessions using cart contents retrieved via `GET /carts/{id}`.

---

## 3. Design

**Scope:** Carts are scoped to a single seller. Each cart is hosted under the seller's `api_base_url`. Agents managing cross-merchant shopping SHOULD maintain separate carts per seller.

### 3.1 Cart vs Checkout

| Aspect | Cart | Checkout Session |
|---|---|---|
| **Purpose** | Pre-purchase exploration | Purchase finalization |
| **Payment** | None | Required (handlers, instruments) |
| **Status** | Binary (exists / not found) | Lifecycle (`incomplete` → `completed`) |
| **Complete operation** | No | Yes |
| **Capability negotiation** | No | Yes (inline `capabilities` object) |
| **Totals** | Estimates (may be partial) | Authoritative pricing |
| **Fulfillment options** | Not available | Available after address provided |
| **Required fields (create)** | `line_items` | `line_items`, `currency`, `capabilities` |

### 3.2 Lifecycle

```
Cart (browsing) ──agent reads cart──▶ Checkout Session (purchasing) ──complete──▶ Order
```

1. Agent creates a cart with one or more items.
2. Agent updates the cart as the buyer adds, removes, or changes items.
3. When the buyer is ready to purchase, the agent retrieves the cart via `GET /carts/{id}` and creates a checkout session using the cart's contents.
4. The checkout proceeds through its normal lifecycle (capability negotiation, payment, completion).

### 3.3 Cart Schema

A `Cart` response contains the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique cart identifier, server-generated. |
| `line_items` | `LineItem[]` | Yes | Cart line items. Same structure as checkout line items. |
| `buyer` | `Buyer` | No | Buyer information, if provided. |
| `currency` | string | Yes | ISO 4217 currency code. Determined by the seller based on context or request. |
| `totals` | `Total[]` | Yes | Estimated cost breakdown. May be partial (e.g., tax omitted if address unknown). |
| `messages` | `Message[]` | No | Validation messages, warnings, or informational notices (e.g., low stock, price changes). |
| `continue_url` | string (URI) | No | URL for cart handoff, sharing, or session recovery. |
| `expires_at` | string (date-time) | No | RFC 3339 timestamp when the cart expires. |

All types (`LineItem`, `Buyer`, `Total`, `Message`) reuse existing ACP definitions from the checkout schema. No new domain types are introduced.

---

## 4. HTTP Interface

### 4.1 Operations

| Operation | Method | Endpoint | Description |
|---|---|---|---|
| Create Cart | `POST` | `/carts` | Create a new cart with items. |
| Get Cart | `GET` | `/carts/{id}` | Retrieve current cart state. |
| Update Cart | `POST` | `/carts/{id}` | Update cart (full replacement). |
| Cancel Cart | `POST` | `/carts/{id}/cancel` | Cancel a cart. |

All endpoints follow ACP's existing HTTP conventions:

- HTTPS required, JSON request/response bodies.
- `Authorization: Bearer <token>` required.
- `API-Version` header required.
- `Idempotency-Key` required on all POST requests.
- Amounts in minor currency units (cents).

### 4.2 Create Cart

`POST /carts`

**Request:**

| Field | Type | Required | Description |
|---|---|---|---|
| `line_items` | `Item[]` | Yes | Items to add to the cart. |
| `buyer` | `Buyer` | No | Buyer information for personalized estimates. |
| `locale` | string | No | Locale code for content localization. |

**Currency resolution:** The `currency` field is not required on the create request. The seller determines currency from available context (buyer locale, buyer address, storefront default, or seller default). If the seller cannot determine a currency, it SHOULD return `422 Unprocessable Entity` with a message requesting the agent provide a `locale` or `buyer` with sufficient context.

**Response:** `201 Created` with `Cart` object.

**Example:**

Request:

```json
POST /carts HTTP/1.1
Authorization: Bearer <token>
API-Version: 2026-01-30
Idempotency-Key: idk_abc123
Content-Type: application/json

{
  "line_items": [
    { "id": "item_123", "quantity": 2 },
    { "id": "item_456", "quantity": 1 }
  ],
  "buyer": {
    "email": "buyer@example.com"
  }
}
```

Response:

```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "cart_abc123",
  "line_items": [
    {
      "id": "li_1",
      "item": { "id": "item_123", "name": "Blue Running Shoes", "unit_amount": 12000 },
      "quantity": 2,
      "totals": [
        { "type": "subtotal", "amount": 24000 }
      ]
    },
    {
      "id": "li_2",
      "item": { "id": "item_456", "name": "Athletic Socks (3-pack)", "unit_amount": 1500 },
      "quantity": 1,
      "totals": [
        { "type": "subtotal", "amount": 1500 }
      ]
    }
  ],
  "buyer": {
    "email": "buyer@example.com"
  },
  "currency": "usd",
  "totals": [
    { "type": "subtotal", "amount": 25500 },
    { "type": "total", "amount": 25500 }
  ],
  "continue_url": "https://seller.example.com/cart/cart_abc123",
  "expires_at": "2026-04-01T12:00:00Z"
}
```

**Error handling:**

When all requested items are unavailable, the seller MAY return an error instead of creating a cart:

```json
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "type": "invalid_request",
  "code": "out_of_stock",
  "message": "All requested items are currently unavailable."
}
```

### 4.3 Get Cart

`GET /carts/{id}`

Returns the current cart state. Returns `404 Not Found` if the cart does not exist, has expired, or was canceled.

### 4.4 Update Cart

`POST /carts/{id}`

Full replacement of the cart. The agent MUST send the complete desired cart state. The provided `line_items` replace the existing cart contents.

**Request:**

| Field | Type | Required | Description |
|---|---|---|---|
| `line_items` | `Item[]` | Yes | Complete list of items (replaces existing). |
| `buyer` | `Buyer` | No | Updated buyer information. |

**Response:** `200 OK` with updated `Cart` object.

**Design rationale — full replacement:** Full replacement is intentional and consistent with ACP's checkout update pattern. While partial update operations (add item, remove item, change quantity) would reduce per-request payload, they significantly increase the API surface area and introduce new failure modes (concurrent add/remove, quantity delta ambiguity, item-level addressing). Agents maintain client-side cart state from the previous response and can trivially reconstruct the full items array. Future protocol versions MAY introduce optimistic concurrency (e.g., `If-Match` / ETag) if race conditions prove problematic in practice.

**Cart expiry:** Sellers SHOULD refresh `expires_at` on any successful update. If a cart has expired, subsequent operations return `404 Not Found`; the agent MAY create a new cart with the previously-known items.

### 4.5 Cancel Cart

`POST /carts/{id}/cancel`

Cancels a cart. The seller MUST return the cart state before deletion. Subsequent operations on this cart ID SHOULD return `404 Not Found`.

**Request body:** Empty or `{}`.

**Response:** `200 OK` with the final `Cart` object.

---

## 5. Future Extensions

Future extensions MAY declare cart support by extending the `Cart` type, following the same `extends` pattern used for checkout extensions (see `rfc.extensions.md`). Extension integration with carts (e.g., discount codes during browsing, fulfillment previews) is deferred to follow-up SEPs.

A follow-up SEP will also define cart-to-checkout conversion via a `cart_id` field on `CheckoutSessionCreateRequest`, including conversion rules, idempotency semantics, and post-conversion cart lifecycle.

---

## 6. Discovery Integration

The cart service is advertised in the discovery document (`/.well-known/acp.json`) as a value in the `capabilities.services` array:

```json
{
  "protocol": {
    "name": "acp",
    "version": "2026-01-30",
    "supported_versions": ["2026-01-30"]
  },
  "api_base_url": "https://seller.example.com/api",
  "transports": ["rest"],
  "capabilities": {
    "services": ["checkout", "orders", "carts"]
  }
}
```

Agents SHOULD check the discovery document for `"carts"` in `capabilities.services` before attempting to create a cart. If cart is not advertised, agents SHOULD fall back to creating checkout sessions directly.

---

## 7. Backward Compatibility

This is a purely additive change:

- **New endpoints**: `/carts`, `/carts/{id}`, `/carts/{id}/cancel` are new paths that do not conflict with existing endpoints.
- **New service value**: `"carts"` in the discovery services enum does not affect existing service values.
- **No changes to existing schemas**: No fields are added to or modified on existing ACP types. The checkout session schema is unchanged.
- **No changes to existing flows**: Checkout session lifecycle, capability negotiation, and payment flows are unchanged.

Agents that do not use carts continue to work exactly as before.

---

## 8. Required Spec Updates

- [ ] `spec/unreleased/json-schema/schema.cart.json` — New schema defining `Cart`, `CartCreateRequest`, `CartUpdateRequest`
- [ ] `spec/unreleased/openapi/openapi.cart.yaml` — New OpenAPI defining cart REST endpoints
- [ ] `spec/unreleased/json-schema/schema.agentic_checkout.json` — Add `"carts"` to discovery services enum
- [ ] `rfcs/rfc.discovery.md` — Add `"carts"` to services enum documentation
- [ ] `changelog/unreleased/cart.md` — Changelog entry

---

## 9. Conformance Checklist

**MUST requirements:**

- [ ] MUST implement `POST /carts` returning `201 Created` with a valid `Cart` object
- [ ] MUST implement `GET /carts/{id}` returning `200 OK` with the current cart state
- [ ] MUST implement `POST /carts/{id}` accepting a full replacement of the cart
- [ ] MUST implement `POST /carts/{id}/cancel` returning `200 OK` with the final cart state
- [ ] MUST return `404 Not Found` for expired, canceled, or nonexistent carts
- [ ] MUST return `id`, `line_items`, `currency`, and `totals` in every cart response

**SHOULD requirements:**

- [ ] SHOULD provide `continue_url` for cart handoff and session recovery
- [ ] SHOULD provide estimated totals when calculable
- [ ] SHOULD return informational messages for validation warnings (low stock, price changes)
- [ ] SHOULD refresh `expires_at` on successful cart updates
- [ ] SHOULD advertise `"carts"` in `capabilities.services` in the discovery document

**MAY requirements:**

- [ ] MAY omit tax totals when address is unknown
- [ ] MAY set cart expiry via `expires_at`
- [ ] MAY return an error response instead of creating a cart when all items are unavailable
