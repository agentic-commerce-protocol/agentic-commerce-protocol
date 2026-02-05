# Native Orders Support

**Added** – rich post-purchase order tracking with line items, fulfillments, and adjustments.

## New Schemas

- **OrderLineItem**: Per-item tracking with `quantity.ordered` and `quantity.shipped`
- **Fulfillment**: Tracks shipping, pickup, and digital delivery with carrier info and tracking
- **FulfillmentEvent**: Append-only log of delivery events (shipped, in transit, delivered, etc.)
- **Adjustment**: Post-order changes (refunds, credits, returns, disputes, chargebacks)
- **OrderTotals**: Order-level financial summary (subtotal, shipping, tax, discount, total)
- **LineItemReference**: References line items in fulfillments and adjustments

## Enhanced Order Schema

The existing `Order` schema gains optional fields:

- `line_items[]` – What was ordered with fulfillment progress
- `fulfillments[]` – How items are being delivered
- `adjustments[]` – Post-order changes
- `totals` – Financial summary

All new fields are optional, maintaining backward compatibility.

## Agent Use Cases

- "Where's my order?" → `fulfillments[]` with tracking and events
- "What did I order?" → `line_items[]` with details
- "Which items shipped?" → `line_items[].quantity.shipped`
- "I got a refund" → `adjustments[]` with status

**Files changed:** `spec/unreleased/openapi/openapi.agentic_checkout.yaml`, `spec/unreleased/json-schema/schema.agentic_checkout.json`, `rfcs/rfc.orders.md`, `examples/orders/`

