## Fix checkout session request examples

Corrected all four inline OpenAPI examples for `POST /checkout_sessions` in the 2026-04-17 `agentic_checkout` spec. Each example used an `items` field with a per-item `quantity` (and, in one case, a nonexistent `product_id`), but `CheckoutSessionCreateRequest` declares `additionalProperties: false` and requires `line_items`, `currency`, and `capabilities`, and `Item` only permits `id`, `name`, and `unit_amount`. Anyone copying any of these examples would send a request the schema (and any merchant validating against it) must reject.

### Changes
- `minimal` example: replaced `items` with `line_items` and added the required `currency` and `capabilities` fields
- `with_address` example: replaced `items` with `line_items`, dropped `quantity`, and added the required `currency` and `capabilities` fields
- `with_first_touch_attribution` example: replaced `items` with `line_items`, dropped `quantity`, and added the required `currency` and `capabilities` fields
- `CheckoutSessionCreateRequest` schema's own inline `example`: replaced `items`/`product_id`/`quantity` with `line_items` using the actual `Item` schema shape

### Files Updated
- `spec/2026-04-17/openapi/openapi.agentic_checkout.yaml`

### Reference
- Issue: #278
