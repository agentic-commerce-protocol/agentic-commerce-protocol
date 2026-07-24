## Fix PaymentHandler.display_order OpenAPI indentation (#279)

`display_order` in `PaymentHandler` was indented as a sibling of `properties`/`required` instead of nested inside `properties`, so OpenAPI validators silently dropped it as an unrecognized schema-object keyword. With `additionalProperties: false` on `PaymentHandler`, this meant a handler object that set `display_order` — the exact usage the field's own description invites — failed schema validation, contradicting the field's documented purpose. The JSON Schema mirror (`schema.agentic_checkout.json`) already nested the field correctly; only the OpenAPI YAML had the indentation bug.

### Changes

- **PaymentHandler (OpenAPI)**: Re-indented `display_order` two spaces to nest it under `properties`, matching the existing JSON Schema definition.

### Files Updated

- `spec/2026-04-17/openapi/openapi.agentic_checkout.yaml`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`

### Reference

- Issue: #279
