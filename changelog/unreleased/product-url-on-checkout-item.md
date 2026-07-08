## Product URL on Checkout Item (SEP #280)

Add optional `url` to `Item` on checkout session create/update requests, letting sellers deterministically resolve which product (and thus brand) a line item refers to when the same identifier or SKU is cross-listed across multiple brands or storefronts under a single seller account.

### Changes

- **Item**: Added optional `url` field — canonical product page URL for the line item

### Benefits

- **Deterministic product resolution**: reduces mis-resolution and mis-fulfillment when identifiers are shared across brands
- **Reuses existing convention**: same name/type/`format: uri` as `OrderLineItem.url`; introduces no new patterns
- **Backward compatible**: field is optional; existing integrations are unaffected

### Files Updated

- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
- `examples/unreleased/examples.agentic_checkout.json`

### Reference

- Issue: #280
