# RFC: Enhanced Order Support

**Status:** Draft
**Version:** 2026-02-05
**Scope:** Rich post-purchase order tracking with fulfillments and adjustments

This RFC enhances the existing `Order` schema with rich post-purchase lifecycle
tracking, enabling agents to provide detailed order status updates, shipment
tracking, and refund visibility to buyers.

---

## 1. Scope & Goals

- Enable **per-line-item tracking** with `quantity.ordered`, `quantity.current`, and `quantity.fulfilled`
- Provide **fulfillment tracking** for shipping, pickup, and digital delivery
- Support **fulfillment events** as an append-only log of delivery progress
- Track **adjustments** for refunds, credits, returns, and disputes
- Maintain **backward compatibility** by making all new fields optional

**Out of scope:** Order management APIs (create, update, cancel orders via API),
inventory management, returns authorization flows.

---

## 2. Motivation

### 2.1 Agent Use Cases

Agents need to answer post-purchase questions:

| Question | Required Data |
|----------|---------------|
| "Where's my order?" | `fulfillments[]` with tracking info and events |
| "What did I order?" | `line_items[]` with product details |
| "Which items shipped?" | `line_items[].quantity.fulfilled` and fulfillment line item refs |
| "Did I get a refund?" | `adjustments[]` with status |
| "When will it arrive?" | `fulfillments[].estimated_delivery` and event history |

### 2.2 What This Enhancement Adds

This enhancement introduces:

- **OrderLineItem** — Per-item tracking with quantity breakdown
- **Fulfillment** — Delivery method tracking (shipping, pickup, digital)
- **FulfillmentEvent** — Point-in-time delivery events
- **Adjustment** — Post-order changes (refunds, returns, credits)
- **Order Totals** — Order-level financial summary (reuses checkout `Total` schema)

---

## 3. Design Philosophy

### 3.1 Progressive Enrichment

All new fields are optional. Merchants can start with the existing minimal Order
response and progressively add richer data as their systems support it:

**Minimal order (existing):**
```json
{
  "id": "ord_123",
  "checkout_session_id": "cs_456",
  "permalink_url": "https://merchant.com/orders/123"
}
```

**Rich order (with new fields):**
```json
{
  "id": "ord_123",
  "checkout_session_id": "cs_456",
  "permalink_url": "https://merchant.com/orders/123",
  "line_items": [...],
  "fulfillments": [...],
  "adjustments": [...],
  "totals": [{ "type": "total", "display_text": "Total", "amount": 15342 }]
}
```

### 3.2 Clear Quantity Semantics

The `quantity` object uses a 3-field model:

| Field | Meaning | Mutable? |
|-------|---------|----------|
| `ordered` | Quantity originally ordered | No (immutable) |
| `current` | Active quantity on the order (may decrease via cancellations/returns) | Yes |
| `fulfilled` | Quantity that has been fulfilled (shipped, picked up, or digitally delivered) | Yes (increases over time) |

**Status derivation from quantity:**
- `removed` if `current == 0`
- `fulfilled` if `fulfilled == current`
- `partial` if `0 < fulfilled < current`
- `processing` otherwise

### 3.3 Fulfillments, Not Shipments

We use `fulfillments[]` rather than `shipments[]` to cover:

- **Shipping** — Physical carrier delivery (with `carrier`, `tracking_number`, `tracking_url`)
- **Pickup** — In-store, curbside, locker pickup (with `ready_for_pickup` status)
- **Digital** — Download links, license keys, streaming access (with `digital_delivery` sub-object)

---

## 4. Schema

### 4.1 Enhanced Order

The existing `Order` schema gains optional fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | No | Discriminator for webhook payloads (always `"order"`) |
| `id` | string | Yes | Order identifier |
| `checkout_session_id` | string | Yes | Associated checkout session |
| `permalink_url` | string (uri) | Yes | Order page URL |
| `order_number` | string | No | Human-readable order number |
| `status` | enum | No | Order-level status |
| `estimated_delivery` | EstimatedDelivery | No | Overall delivery estimate |
| `confirmation` | OrderConfirmation | No | Confirmation details |
| `support` | SupportInfo | No | Support contact info |
| `line_items` | OrderLineItem[] | No | What was ordered |
| `fulfillments` | Fulfillment[] | No | How items are delivered |
| `adjustments` | Adjustment[] | No | Post-order changes |
| `totals` | Total[] | No | Financial summary (reuses checkout `Total` schema) |

**Order status values:**
- `created` — Order received but not yet confirmed
- `confirmed` — Order placed successfully
- `manual_review` — Order held for fraud or manual review
- `processing` — Being prepared
- `shipped` — All items handed to carrier
- `completed` — All items delivered/received by the buyer regardless of fulfillment method
- `canceled` — Order canceled

### 4.2 OrderLineItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Line item identifier |
| `title` | string | Yes | Product name |
| `product_id` | string | No | Catalog product ID |
| `description` | string | No | Product description |
| `image_url` | string (uri) | No | Product image |
| `url` | string (uri) | No | Product page URL |
| `quantity` | OrderLineItemQuantity | Yes | Quantity tracking |
| `unit_price` | integer | No | Price per unit (minor units) |
| `subtotal` | integer | No | Line total (minor units) |
| `totals` | Total[] | No | Optional line-item totals breakdown (same schema as checkout) |
| `status` | enum | No | Derived line item status |

**OrderLineItemQuantity:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ordered` | integer (≥1) | Yes | Quantity originally ordered |
| `current` | integer (≥0) | Yes | Active quantity (may decrease via cancellations/returns) |
| `fulfilled` | integer (≥0) | No | Quantity fulfilled (default 0) |

**Line item status values:** `processing`, `partial`, `fulfilled`, `removed`

**Line item status derivation:**
- `removed` — `current == 0`
- `fulfilled` — `fulfilled == current`
- `partial` — `0 < fulfilled < current`
- `processing` — otherwise

### 4.3 Fulfillment

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Fulfillment identifier |
| `type` | enum | Yes | `shipping`, `pickup`, `digital` |
| `status` | enum | No | Current status (see applicability table below) |
| `line_items` | LineItemReference[] | No | Items in this fulfillment |
| `carrier` | string | No | Carrier name (shipping only) |
| `tracking_number` | string | No | Tracking number (shipping only) |
| `tracking_url` | string (uri) | No | Tracking URL (shipping only) |
| `destination` | Address | No | Delivery address |
| `estimated_delivery` | EstimatedDelivery | No | Delivery estimate |
| `digital_delivery` | object | No | Digital delivery details (digital only) |
| `description` | string | No | Human-readable description |
| `events` | FulfillmentEvent[] | No | Event history |

**`digital_delivery` object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `access_url` | string (uri) | No | URL to access digital content |
| `license_key` | string | No | License or activation key |
| `expires_at` | string (date-time) | No | When access expires |

**Fulfillment status values:**
- `pending` — Not yet started (e.g., backordered)
- `processing` — Being prepared
- `shipped` — Handed to carrier
- `in_transit` — In carrier network
- `out_for_delivery` — On delivery vehicle
- `ready_for_pickup` — Ready for customer pickup
- `delivered` — Successfully delivered
- `failed` — Delivery failed
- `canceled` — Fulfillment canceled

**Status applicability by fulfillment type:**

Not all statuses apply to all fulfillment types. Merchants SHOULD only use
applicable statuses for each type:

| Status | shipping | pickup | digital |
|--------|----------|--------|---------|
| `pending` | yes | yes | yes |
| `processing` | yes | yes | yes |
| `shipped` | yes | - | - |
| `in_transit` | yes | - | - |
| `out_for_delivery` | yes | - | - |
| `ready_for_pickup` | - | yes | - |
| `delivered` | yes | yes | yes |
| `failed` | yes | yes | yes |
| `canceled` | yes | yes | yes |

**LineItemReference:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Line item ID |
| `quantity` | integer (≥1) | Yes | Quantity in this fulfillment |

### 4.4 FulfillmentEvent

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Event identifier |
| `type` | enum | Yes | Event type |
| `occurred_at` | string (date-time) | Yes | When event occurred |
| `description` | string | No | Human-readable description |
| `location` | string | No | Event location |

**Event type values:**
- `processing` — Being prepared
- `shipped` — Handed to carrier
- `in_transit` — In carrier network
- `out_for_delivery` — On delivery vehicle (ACP extension)
- `ready_for_pickup` — Ready for customer pickup (ACP extension)
- `delivered` — Successfully delivered
- `failed_attempt` — Delivery attempt failed
- `returned_to_sender` — Returned to sender
- `canceled` — Fulfillment canceled
- `undeliverable` — Cannot be delivered

### 4.5 Adjustment

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Adjustment identifier |
| `type` | enum | Yes | Adjustment type |
| `occurred_at` | string (date-time) | Yes | When adjustment occurred |
| `status` | enum | Yes | Adjustment status |
| `line_items` | LineItemReference[] | No | Affected line items |
| `amount` | integer | No | Total amount credited to buyer (minor units, tax-inclusive) |
| `currency` | string | No | ISO 4217 currency code |
| `description` | string | No | Human-readable reason |
| `reason` | string | No | Structured reason code |

**Adjustment type values:**
- `refund` — Refund (full or partial — distinguish by amount)
- `credit` — Store credit issued
- `return` — Item return processed
- `exchange` — Item exchanged
- `price_adjustment` — Price change (e.g., price match, coupon applied post-purchase)
- `cancellation` — Order/item canceled
- `dispute` — Dispute or chargeback

**Adjustment status values:**
- `pending` — In progress
- `completed` — Successfully completed
- `failed` — Failed to process

### 4.6 Order Totals

Order-level totals reuse the existing `Total` schema from the checkout spec.
`Order.totals` is a `Total[]` array, the same shape used on checkout sessions,
line items, and fulfillment options.

This means agents parsing checkout and order responses can use the same code
path for totals extraction.

**Order-relevant `Total.type` values:**

| Type | Description |
|------|-------------|
| `subtotal` | Sum of line item subtotals |
| `fulfillment` | Shipping / delivery cost |
| `tax` | Tax amount |
| `discount` | Total discount |
| `total` | Original order total as charged at checkout |
| `amount_refunded` | Total amount refunded to buyer (sum of completed refund adjustments) |

The `amount_refunded` type is new for post-purchase tracking. All other types
are shared with checkout totals.

**Note on `total` semantics:** The entry with `type: "total"` always represents
the original charged amount at checkout, before any post-order adjustments
(refunds, credits, etc.). This allows agents to surface both numbers
unambiguously: "Your order was $670.99 and you've been refunded $325.16."
Agents SHOULD NOT subtract adjustments from `total` to derive a net amount.

---

## 5. Examples

### 5.1 Partial Shipment

Order with one fulfilled and one pending fulfillment:

```json
{
  "id": "ord_123",
  "checkout_session_id": "cs_456",
  "permalink_url": "https://merchant.com/orders/123",
  "status": "processing",
  "line_items": [
    {
      "id": "li_shoes",
      "title": "Running Shoes",
      "quantity": { "ordered": 3, "current": 3, "fulfilled": 3 },
      "unit_price": 9900,
      "subtotal": 29700,
      "status": "fulfilled"
    },
    {
      "id": "li_shirts",
      "title": "Cotton T-Shirt",
      "quantity": { "ordered": 2, "current": 2, "fulfilled": 0 },
      "unit_price": 2500,
      "subtotal": 5000,
      "status": "processing"
    }
  ],
  "fulfillments": [
    {
      "id": "ful_1",
      "type": "shipping",
      "status": "delivered",
      "line_items": [{ "id": "li_shoes", "quantity": 3 }],
      "carrier": "FedEx",
      "tracking_number": "123456789",
      "tracking_url": "https://fedex.com/track/123456789",
      "events": [
        { "id": "evt_1", "type": "shipped", "occurred_at": "2026-02-02T10:00:00Z" },
        { "id": "evt_2", "type": "delivered", "occurred_at": "2026-02-04T14:00:00Z", "description": "Left at front door" }
      ]
    },
    {
      "id": "ful_2",
      "type": "shipping",
      "status": "pending",
      "line_items": [{ "id": "li_shirts", "quantity": 2 }],
      "description": "Backordered - ships Feb 15",
      "events": []
    }
  ],
  "totals": [
    { "type": "subtotal", "display_text": "Subtotal", "amount": 34700 },
    { "type": "fulfillment", "display_text": "Shipping", "amount": 1200 },
    { "type": "tax", "display_text": "Tax", "amount": 2890 },
    { "type": "total", "display_text": "Total", "amount": 38790 }
  ]
}
```

**Agent response:** "Your 3 pairs of Running Shoes were delivered on Feb 4. Your 2 Cotton T-Shirts are backordered and will ship Feb 15."

### 5.2 Order with Refund

Order with a partial refund for a defective item. Note that `adjustment.amount`
is tax-inclusive (item price + applicable tax), and the `total` entry is the
original charged amount:

```json
{
  "id": "ord_456",
  "checkout_session_id": "cs_789",
  "permalink_url": "https://merchant.com/orders/456",
  "status": "completed",
  "line_items": [
    {
      "id": "li_headphones",
      "title": "Wireless Headphones",
      "quantity": { "ordered": 2, "current": 2, "fulfilled": 2 },
      "unit_price": 14900,
      "subtotal": 29800,
      "status": "fulfilled"
    }
  ],
  "adjustments": [
    {
      "id": "adj_1",
      "type": "refund",
      "occurred_at": "2026-02-10T14:30:00Z",
      "status": "completed",
      "line_items": [{ "id": "li_headphones", "quantity": 1 }],
      "amount": 16092,
      "currency": "usd",
      "description": "Defective item - one earpiece not working (includes $11.92 tax)"
    }
  ],
  "totals": [
    { "type": "subtotal", "display_text": "Subtotal", "amount": 29800 },
    { "type": "tax", "display_text": "Tax", "amount": 2384 },
    { "type": "total", "display_text": "Total", "amount": 32184 },
    { "type": "amount_refunded", "display_text": "Refunded", "amount": 16092 }
  ]
}
```

**Agent response:** "Your order was $321.84. You received a $160.92 refund for a defective pair of headphones on Feb 10."

### 5.3 Digital Delivery

Order with a software license delivered digitally:

```json
{
  "id": "ord_789",
  "checkout_session_id": "cs_012",
  "permalink_url": "https://merchant.com/orders/789",
  "status": "completed",
  "line_items": [
    {
      "id": "li_software",
      "title": "Pro Photo Editor - Annual License",
      "quantity": { "ordered": 1, "current": 1, "fulfilled": 1 },
      "unit_price": 9900,
      "subtotal": 9900,
      "status": "fulfilled"
    }
  ],
  "fulfillments": [
    {
      "id": "ful_1",
      "type": "digital",
      "status": "delivered",
      "line_items": [{ "id": "li_software", "quantity": 1 }],
      "digital_delivery": {
        "access_url": "https://merchant.com/downloads/photo-editor?token=abc123",
        "license_key": "PPRO-2026-XXXX-YYYY-ZZZZ",
        "expires_at": "2027-02-10T00:00:00Z"
      }
    }
  ],
  "totals": [
    { "type": "subtotal", "display_text": "Subtotal", "amount": 9900 },
    { "type": "tax", "display_text": "Tax", "amount": 866 },
    { "type": "total", "display_text": "Total", "amount": 10766 }
  ]
}
```

**Agent response:** "Your Pro Photo Editor license has been delivered. Your license key is PPRO-2026-XXXX-YYYY-ZZZZ and expires Feb 10, 2027."

---

## 6. Webhook Events

Order updates are sent via the existing Order webhook mechanism. When sending
order updates, merchants MUST include the full order object (not incremental
deltas). All optional Order fields (`line_items`, `fulfillments`, `adjustments`,
`totals`) SHOULD be included when available.

### 6.1 Webhook Schema

The `EventDataOrder` schema in `openapi.agentic_checkout_webhook.yaml` composes
the full `Order` schema via `$ref`. This means all Order fields are accepted in
webhook payloads. The `type: "order"` discriminator field MUST be included in
webhook payloads.

### 6.2 Replacement of `refunds[]` with `adjustments[]`

The legacy `refunds[]` field and `Refund` schema have been **removed** from the
webhook spec. The `adjustments[]` array on the Order schema is the only
supported mechanism for representing refunds, credits, returns, disputes, and
other post-order changes in webhook payloads.

Existing integrations that previously used `refunds[]` MUST migrate to
`adjustments[]` with `type: "refund"` or `type: "store_credit"` as appropriate.

---

## 7. Implementation Notes

### 7.1 Status Derivation

Merchants MAY derive `status` fields from the quantity fields:

**Line item status:**
```
if (current == 0) → "removed"
if (fulfilled == current) → "fulfilled"
if (fulfilled > 0 && fulfilled < current) → "partial"
else → "processing"
```

**Order status:**
```
if (order just received) → "created"
if (held for review) → "manual_review"
if (all line items removed) → "canceled"
if (all fulfillments delivered) → "completed"
if (all line items fulfilled but not all delivered) → "shipped"
if (any line item in progress) → "processing"
else → "confirmed"
```

### 7.2 Backward Compatibility

Existing integrations that only read `id`, `checkout_session_id`, and
`permalink_url` will continue to work. New fields are additive.

### 7.3 Empty Arrays

An empty `fulfillments: []` array means no fulfillment tracking is available.
An empty `adjustments: []` array means no post-order changes have occurred.

---

## 8. Change Log

- **2026-04-30**: Open enums — Converted all order-related status and type fields from closed enums to open enums (string with documented values). Implementations MUST accept unrecognized values gracefully for forward/backward compatibility.
- **2026-04-23**: Post-checkout alignment — 3-field quantity model (`ordered`/`current`/`fulfilled`), line item status (`processing`/`partial`/`fulfilled`/`removed`), order status `delivered`→`completed`, fulfillment event types (add `canceled`/`undeliverable`, rename `returned`→`returned_to_sender`), adjustment types (merge `refund`+`partial_refund`, rename `store_credit`→`credit`, add `price_adjustment`, merge `chargeback` into `dispute`)
- **2026-02-11**: Totals alignment — Replaced flat `OrderTotals` object with `Total[]` array (reusing checkout spec's `Total` schema); added `amount_refunded` to `Total.type` enum
- **2026-02-10**: Review feedback — Extended Order.status enum (`created`, `manual_review`); added `amount_refunded` to OrderTotals; documented `total` as original charge amount; added `digital_delivery` sub-object to Fulfillment; added `ready_for_pickup` status; documented per-type status applicability; clarified `Adjustment.amount` as tax-inclusive; updated webhook spec to compose Order via `$ref`; removed `refunds[]` in favor of `adjustments[]`
- **2026-02-05**: Initial draft — Added OrderLineItem, Fulfillment, FulfillmentEvent, Adjustment, OrderTotals schemas

