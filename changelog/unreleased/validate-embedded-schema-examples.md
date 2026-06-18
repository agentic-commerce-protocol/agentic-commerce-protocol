## Validate embedded schema examples

Adds consistency validation for examples embedded directly on unreleased JSON Schema
and OpenAPI model definitions.

### Changes

- Validate `example` and `examples` on JSON Schema `$defs`.
- Validate `example` and `examples` on OpenAPI `components.schemas`.
- Track existing known embedded-example failures so new drift fails validation
  without requiring a broad example cleanup in this change.

### Files Updated

- `scripts/validate-consistency.js`
