# Unreleased Changes

## Sale Extension & Discount Extension Amendment

New `sale` extension providing sale pricing context on checkout sessions, and companion amendments to the `discount` extension for discount eligibility.

### New: Sale Extension

- **Session-level `sales[]` registry** — named sale campaigns with description, start/end window, and metadata
- **Per-item `sale` object** on LineItem — `compare_at_amount` (was price), `lowest_recent_amount` and `lowest_recent_period_days` (EU Omnibus Directive compliance)
- **Extension declaration** — `sale` extension extends `$.CheckoutSession.sales` and `$.LineItem.sale`
- **Normalized model** — sale metadata defined once at session level, referenced by item via `sale.id`

### Amendment: Discount Extension

- **`discount_eligible` field** on LineItem (boolean, default: `true`) — whether item accepts code-based discount codes
- **New rejection reason** `discount_code_item_ineligible` — for carts where all eligible items are ineligible for discount codes
- **`excluded_items` on `AppliedDiscount`** — transparency for partial discount application with exclusion reasons
- **Updated `extends`** — discount extension now also extends `$.LineItem.discount_eligible`

### Changes

- New RFC: `rfcs/rfc.sale_extension.md`
- New schema: `spec/unreleased/json-schema/schema.sale.json`
- Updated: `spec/unreleased/json-schema/schema.discount.json` — new error code, excluded_items, line_item_discount_eligible
- Updated: `spec/unreleased/json-schema/schema.extension.json` — sale added to core_extensions, discount extends updated
- Updated: `spec/unreleased/json-schema/schema.agentic_checkout.json` — Sale, LineItemSale, ExcludedItem defs; sales on CheckoutSession; sale and discount_eligible on LineItem
- Updated: `spec/unreleased/openapi/openapi.agentic_checkout.yaml` — matching OpenAPI changes
- Updated: `rfcs/rfc.discount_extension.md` — discount eligibility amendment
- New examples: `examples/unreleased/sale-extension/` (5 examples + README)

### Related

- Closes issue #122
