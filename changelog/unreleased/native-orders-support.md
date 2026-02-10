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

- `type` – Discriminator field for webhook payloads (always `"order"`)
- `line_items[]` – What was ordered with fulfillment progress
- `fulfillments[]` – How items are being delivered
- `adjustments[]` – Post-order changes
- `totals` – Financial summary

All new fields are optional, maintaining backward compatibility.

## Order Status Enum

Extended to a superset that aligns with the webhook spec:
`[created, confirmed, manual_review, processing, shipped, delivered, canceled]`

## OrderTotals Semantics

- `total` is now documented as the original charged amount at checkout (pre-adjustment)
- Added optional `amount_refunded` field for sum of completed refund adjustments

## Digital Fulfillment

- Added `digital_delivery` sub-object to Fulfillment with `access_url`, `license_key`, `expires_at`
- Added `ready_for_pickup` to Fulfillment and FulfillmentEvent status/type enums
- Documented per-type status applicability (which statuses apply to shipping, pickup, digital)

## Adjustment Amount

- `Adjustment.amount` is now documented as the total amount credited to the buyer, inclusive of tax

## Webhook Spec Alignment

- `EventDataOrder` now composes the full `Order` schema via cross-file `$ref`
- `refunds[]` and the `Refund` schema have been removed from `EventDataOrder` in favor of `adjustments[]`
- Fixed pre-existing bug: inline example had `amount: "1.00"` (string) instead of integer
- Updated inline examples to show rich Order fields (line_items, fulfillments, adjustments, totals)

## Agent Use Cases

- "Where's my order?" → `fulfillments[]` with tracking and events
- "What did I order?" → `line_items[]` with details
- "Which items shipped?" → `line_items[].quantity.shipped`
- "Did I get a refund?" → `adjustments[]` with status
- "How much was I refunded?" → `totals.amount_refunded`

**Files changed:** `spec/unreleased/openapi/openapi.agentic_checkout.yaml`, `spec/unreleased/openapi/openapi.agentic_checkout_webhook.yaml`, `spec/unreleased/json-schema/schema.agentic_checkout.json`, `rfcs/rfc.orders.md`, `examples/orders/`
