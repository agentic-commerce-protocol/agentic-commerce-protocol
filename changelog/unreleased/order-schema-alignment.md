## Order Schema: Post-Checkout Alignment

### Motivation

Sellers send order events — shipping, refunds, cancellations — to platforms, which fan them
out to agents. The order model needs clear, unambiguous semantics to support this pipeline
end-to-end.

This change addresses five categories of misalignment in the order schema:

1. **Quantity model was too narrow.** The 2-field model (`ordered`/`shipped`) couldn't represent
   cancellations or returns (no way to say "3 ordered, 1 canceled, 2 shipped"). The 3-field
   model (`ordered`/`current`/`fulfilled`) tracks the full lifecycle.

2. **Status values were shipping-centric.** `shipped` and `delivered` as line item statuses
   don't apply to pickup or digital fulfillment. The new values (`fulfilled`, `removed`) are
   fulfillment-type-agnostic and derived directly from the quantity fields.

3. **Order status overloaded "fulfilled".** Using `fulfilled` at both the order and line item
   level would create confusion: `LineItem.status = "fulfilled"` means the seller has dispatched
   the item (quantity-derived), while at the order level it would mean everything has been
   received by the buyer. We use `completed` at the order level to avoid this ambiguity.

4. **Fulfillment event types had gaps.** Missing `canceled` and `undeliverable` forced
   merchants to abuse `failed_attempt` for terminal failure states. `returned` was renamed to
   `returned_to_sender` for precision.

5. **Adjustment types had redundancy.** `refund`/`partial_refund` is a false distinction (the
   amount already tells you). `store_credit` was jargon-heavy. `chargeback` is a subtype of
   `dispute`. `price_adjustment` was missing entirely.

### Breaking Changes

- **LineItem quantity**: 2-field model (`ordered`/`shipped`) → 3-field model
  (`ordered`/`current`/`fulfilled`). `current` is now required. `fulfilled` replaces `shipped`
  and applies to all fulfillment types (shipping, pickup, digital).

- **LineItem status**: `[processing, partial, shipped, delivered, canceled]` →
  `[processing, partial, fulfilled, removed]`. Status is now deterministically derived from
  quantity fields: `removed` if `current==0`, `fulfilled` if `fulfilled==current`, `partial` if
  `0 < fulfilled < current`, `processing` otherwise.

- **Order status**: `delivered` → `completed`. The term `completed` avoids confusion with
  `LineItem.status = "fulfilled"` (which triggers at dispatch time, not delivery time).

- **FulfillmentEvent type**: `returned` → `returned_to_sender`. Added `canceled` and
  `undeliverable`.

- **Adjustment type**: `partial_refund` merged into `refund` (distinguish by amount).
  `store_credit` → `credit`. `chargeback` merged into `dispute`. Added `price_adjustment`.

- **Open enums**: All order-related status and type fields are now open enums (`type: string`
  with defined values in descriptions) rather than closed enums. Implementations MUST accept
  unrecognized values gracefully. This enables forward and backward compatibility as the
  protocol evolves without requiring schema-breaking changes for new values.

### Semantic model

The order schema now has distinct terminology at each level to avoid ambiguity:

| Level | Field | Values | Meaning |
|-------|-------|--------|---------|
| Order | `status` | `completed` | Buyer has received everything |
| LineItem | `status` | `fulfilled` | Seller's obligation met for this item (dispatched) |
| Fulfillment | `status` | `delivered` | Physical/digital delivery confirmed (unchanged) |
| FulfillmentEvent | `type` | `delivered` | The delivery event occurred (unchanged) |

### Files Changed

- `spec/*/json-schema/schema.agentic_checkout.json`
- `spec/*/openapi/openapi.agentic_checkout.yaml`
- `spec/*/openapi/openapi.agentic_checkout_webhook.yaml`
- `examples/*/orders/*.json`
- `rfcs/rfc.orders.md`
