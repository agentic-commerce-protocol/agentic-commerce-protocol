# Sale Extension Examples

This directory contains examples demonstrating the ACP Sale Extension and its companion Discount Extension amendments.

## Examples

### [capabilities-declaration.json](./capabilities-declaration.json)
Shows both `sale` and `discount` extensions declared in `capabilities.extensions`. A single item on sale with compare-at pricing — the simplest possible sale extension usage.

### [winter-sale-item.json](./winter-sale-item.json)
Full sale metadata with campaign name, description, start/end window, and EU Omnibus compliance fields (`lowest_recent_amount`, `lowest_recent_period_days`). The item has `discount_eligible: false`, demonstrating that sale items can be excluded from discount codes.

### [mixed-cart-sale-discount.json](./mixed-cart-sale-discount.json)
A cart with one sale item and one regular item. A discount code is applied but only to the regular item — the sale item is excluded. Demonstrates `excluded_items` on `AppliedDiscount` and partial discount application.

### [discount-ineligible-no-sale.json](./discount-ineligible-no-sale.json)
Proves that `discount_eligible` is independent of the `sale` extension. An item has `discount_eligible: false` with no sale object — it's a limited edition item that simply doesn't accept discount codes. A submitted code is rejected with `discount_code_item_ineligible`.

### [bfcm-multiple-sales.json](./bfcm-multiple-sales.json)
Two concurrent sales (Black Friday and Cyber Monday) in the `sales[]` registry, demonstrating array priority ordering, metadata on sales, and a 365-day lookback period. Three line items span both sales plus a regular-priced item.

## Key Concepts

### Normalized Model

Sale data is split across two levels:
- **Session-level `sales[]`** — the sale entity with shared metadata (name, description, window). Defined once, avoids per-item repetition.
- **Line-item `sale`** — per-item pricing context (`compare_at_amount`, EU Omnibus fields). References the session-level sale by `id`.

### The `extends` Field

The `sale` extension declares two extension points:

| JSONPath | Description |
|----------|-------------|
| `$.CheckoutSession.sales` | Adds `sales[]` registry to checkout session responses |
| `$.LineItem.sale` | Adds `sale` pricing context to line items |

### `discount_eligible` Independence

The `discount_eligible` field lives in the `discount` extension, not the `sale` extension. An item can be discount-ineligible without being on sale (new arrivals, MAP-restricted items, limited editions). This is demonstrated in [discount-ineligible-no-sale.json](./discount-ineligible-no-sale.json).

### EU Omnibus Pattern

For EU compliance, include `lowest_recent_amount` and `lowest_recent_period_days` on the line-item `sale` object. The `dependentRequired` schema constraint ensures that when `lowest_recent_amount` is present, `lowest_recent_period_days` must also be provided.

### Array Ordering

The `sales[]` array ordering indicates presentation priority — the first entry is the most prominent or urgent sale. Agents can use this to decide which sale to highlight first.

## Related Documentation

- [RFC: Sale Extension](../../rfcs/rfc.sale_extension.md)
- [RFC: Discount Extension](../../rfcs/rfc.discount_extension.md)
- [RFC: Extensions Framework](../../rfcs/rfc.extensions.md)
- [Sale Extension Schema](../../spec/unreleased/json-schema/schema.sale.json)
- [Discount Extension Schema](../../spec/unreleased/json-schema/schema.discount.json)
