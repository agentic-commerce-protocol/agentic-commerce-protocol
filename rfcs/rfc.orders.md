# RFC: Enhanced Order Support

**Status:** Draft
**Version:** 2026-02-05
**Scope:** Rich post-purchase order tracking with fulfillments and adjustments

This RFC enhances the existing `Order` schema with rich post-purchase lifecycle
tracking, enabling agents to provide detailed order status updates, shipment
tracking, and refund visibility to buyers.

---

## 1. Scope & Goals

- Enable **per-line-item tracking** with `quantity.ordered` and `quantity.shipped`
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
| "Which items shipped?" | `line_items[].quantity.shipped` and fulfillment line item refs |
| "Did I get a refund?" | `adjustments[]` with status |
| "When will it arrive?" | `fulfillments[].estimated_delivery` and event history |

### 2.2 What This Enhancement Adds

This enhancement introduces:

- **OrderLineItem** — Per-item tracking with quantity breakdown
- **Fulfillment** — Delivery method tracking (shipping, pickup, digital)
- **FulfillmentEvent** — Point-in-time delivery events
- **Adjustment** — Post-order changes (refunds, returns, credits)
- **OrderTotals** — Order-level financial summary

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
  "totals": { "total": 15342, "currency": "usd" }
}
```

### 3.2 Clear Quantity Semantics

The `quantity` object uses explicit field names:

| Field | Meaning | Mutable? |
|-------|---------|----------|
| `ordered` | Quantity originally ordered | Yes (if partially canceled) |
| `shipped` | Quantity handed to carrier | Yes (increases over time) |

Future-extensible: `delivered`, `returned`, `canceled` can be added as optional
fields without breaking existing implementations.

### 3.3 Fulfillments, Not Shipments

We use `fulfillments[]` rather than `shipments[]` to cover:

- **Shipping** — Physical carrier delivery
- **Pickup** — In-store, curbside, locker pickup
- **Digital** — Download links, license keys, streaming access

---

## 4. Schema

### 4.1 Enhanced Order

The existing `Order` schema gains optional fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
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
| `totals` | OrderTotals | No | Financial summary |

**Order status values:**
- `confirmed` — Order placed successfully
- `processing` — Being prepared
- `shipped` — All items handed to carrier
- `delivered` — All items delivered
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
| `status` | enum | No | Derived line item status |

**OrderLineItemQuantity:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ordered` | integer (≥1) | Yes | Quantity ordered |
| `shipped` | integer (≥0) | No | Quantity shipped (default 0) |

**Line item status derivation:**
- `processing` — `shipped == 0`
- `partial` — `0 < shipped < ordered`
- `shipped` — `shipped == ordered`
- `delivered` — All units delivered (derived from fulfillment events)
- `canceled` — Line item canceled

### 4.3 Fulfillment

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Fulfillment identifier |
| `type` | enum | Yes | `shipping`, `pickup`, `digital` |
| `status` | enum | No | Current status |
| `line_items` | LineItemReference[] | No | Items in this fulfillment |
| `carrier` | string | No | Carrier name |
| `tracking_number` | string | No | Tracking number |
| `tracking_url` | string (uri) | No | Tracking URL |
| `destination` | Address | No | Delivery address |
| `estimated_delivery` | EstimatedDelivery | No | Delivery estimate |
| `description` | string | No | Human-readable description |
| `events` | FulfillmentEvent[] | No | Event history |

**Fulfillment status values:**
- `pending` — Not yet started (e.g., backordered)
- `processing` — Being prepared
- `shipped` — Handed to carrier
- `in_transit` — In carrier network
- `out_for_delivery` — On delivery vehicle
- `delivered` — Successfully delivered
- `failed` — Delivery failed
- `canceled` — Fulfillment canceled

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
- `out_for_delivery` — On delivery vehicle
- `delivered` — Successfully delivered
- `failed_attempt` — Delivery attempt failed
- `returned` — Returned to sender

### 4.5 Adjustment

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Adjustment identifier |
| `type` | enum | Yes | Adjustment type |
| `occurred_at` | string (date-time) | Yes | When adjustment occurred |
| `status` | enum | Yes | Adjustment status |
| `line_items` | LineItemReference[] | No | Affected line items |
| `amount` | integer | No | Amount in minor units |
| `currency` | string | No | ISO 4217 currency code |
| `description` | string | No | Human-readable reason |
| `reason` | string | No | Structured reason code |

**Adjustment type values:**
- `refund` — Full refund
- `partial_refund` — Partial refund
- `store_credit` — Store credit issued
- `return` — Item return processed
- `exchange` — Item exchanged
- `cancellation` — Order/item canceled
- `dispute` — Dispute opened
- `chargeback` — Chargeback received

**Adjustment status values:**
- `pending` — In progress
- `completed` — Successfully completed
- `failed` — Failed to process

### 4.6 OrderTotals

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subtotal` | integer | No | Sum of line item subtotals |
| `shipping` | integer | No | Shipping cost |
| `tax` | integer | No | Tax amount |
| `discount` | integer | No | Total discount |
| `total` | integer | Yes | Final order total |
| `currency` | string | Yes | ISO 4217 currency code |

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
      "quantity": { "ordered": 3, "shipped": 3 },
      "unit_price": 9900,
      "subtotal": 29700,
      "status": "shipped"
    },
    {
      "id": "li_shirts",
      "title": "Cotton T-Shirt",
      "quantity": { "ordered": 2, "shipped": 0 },
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
  "totals": {
    "subtotal": 34700,
    "shipping": 1200,
    "tax": 2890,
    "total": 38790,
    "currency": "usd"
  }
}
```

**Agent response:** "Your 3 pairs of Running Shoes were delivered on Feb 4. Your 2 Cotton T-Shirts are backordered and will ship Feb 15."

### 5.2 Order with Refund

Order with a partial refund for a defective item:

```json
{
  "id": "ord_456",
  "checkout_session_id": "cs_789",
  "permalink_url": "https://merchant.com/orders/456",
  "status": "delivered",
  "line_items": [
    {
      "id": "li_headphones",
      "title": "Wireless Headphones",
      "quantity": { "ordered": 2, "shipped": 2 },
      "unit_price": 14900,
      "subtotal": 29800,
      "status": "delivered"
    }
  ],
  "adjustments": [
    {
      "id": "adj_1",
      "type": "refund",
      "occurred_at": "2026-02-10T14:30:00Z",
      "status": "completed",
      "line_items": [{ "id": "li_headphones", "quantity": 1 }],
      "amount": 14900,
      "currency": "usd",
      "description": "Defective item - one earpiece not working"
    }
  ],
  "totals": {
    "subtotal": 29800,
    "tax": 2384,
    "total": 32184,
    "currency": "usd"
  }
}
```

**Agent response:** "Your order was delivered. You received a $149.00 refund for a defective pair of headphones on Feb 10."

---

## 6. Webhook Events

Order updates are sent via the existing Order webhook mechanism. When sending
order updates, merchants MUST include the full order object (not incremental
deltas).

See `openapi.agentic_checkout_webhook.yaml` for webhook schema.

---

## 7. Implementation Notes

### 7.1 Status Derivation

Merchants MAY derive `status` fields from the event log:

**Line item status:**
```
if (shipped == 0) → "processing"
if (shipped > 0 && shipped < ordered) → "partial"
if (shipped == ordered) → "shipped"
// Check fulfillment events for "delivered" status
```

**Order status:**
```
if (all line items canceled) → "canceled"
if (all line items delivered) → "delivered"
if (all line items shipped) → "shipped"
if (any line item shipped) → "processing"
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

- **2026-02-05**: Initial draft — Added OrderLineItem, Fulfillment, FulfillmentEvent, Adjustment, OrderTotals schemas

