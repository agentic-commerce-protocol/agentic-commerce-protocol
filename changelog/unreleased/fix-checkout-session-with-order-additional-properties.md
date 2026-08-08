## Fix CheckoutSessionWithOrder allOf + additionalProperties: false (#277)

`CheckoutSessionWithOrder` composed `CheckoutSessionBase` via `allOf` and added the `order`
property in a sibling branch. `CheckoutSessionBase` sets `additionalProperties: false`, and in
JSON Schema (including OpenAPI 3.1's draft 2020-12 dialect) `additionalProperties` only sees
properties declared in the same schema object, not properties contributed by sibling `allOf`
branches. As a result, `order` was rejected as an unrecognized field — meaning the spec's own
documented example response for `POST /checkout_sessions/{id}/complete` failed validation
against its own schema. The JSON Schema mirror (`schema.agentic_checkout.json`) already declared
`order` directly on `CheckoutSessionBase`; only the OpenAPI YAML had the broken composition.

### Changes

- **CheckoutSessionBase (OpenAPI)**: Added `order` as an optional property (`$ref` to `Order`)
  directly on `CheckoutSessionBase`, matching the JSON Schema mirror. `CheckoutSessionWithOrder`
  still marks `order` as `required` via its `allOf` extension branch.

### Files Updated

- `spec/2026-04-17/openapi/openapi.agentic_checkout.yaml`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`

### Reference

- Issue: #277
