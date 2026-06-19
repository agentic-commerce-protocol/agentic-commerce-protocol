## Fix checkout request line item schema references

The checkout request schemas pointed `line_items` at `Item` instead of `LineItem` in the versioned OpenAPI files. That dropped the quantity-bearing request shape from generated clients and left the create-request examples out of sync with the schema.

### Changes
- Updated `CheckoutSessionCreateRequest.line_items` and `CheckoutSessionUpdateRequest.line_items` to reference `LineItem` in the `2026-01-30`, `2026-04-17`, and `unreleased` OpenAPI specs
- Corrected the create-request examples to use `line_items` with `LineItem`-shaped entries

### Files Updated
- `spec/2026-01-30/openapi/openapi.agentic_checkout.yaml`
- `spec/2026-04-17/openapi/openapi.agentic_checkout.yaml`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`

### Reference
- Issue: #264
