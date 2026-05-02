## Fix delegate_payment error response example shape

Error response examples in `spec/unreleased/openapi/openapi.delegate_payment.yaml` wrapped the body in `{ "error": { ... } }`. The `Error` schema is `additionalProperties: false` with `type`, `code`, `message` required at the top level, and the agentic_checkout RFC §3 documents the flat shape ("Error Shape (flat)"). None of the 9 error examples validated against the schema they reference.

### Changes
- Removed the `error:` wrapper from all 9 error response examples (400, 401, 409, 422, 429, 500, 503).

### Out of scope
`type`/`code` values left unchanged. The `Error` enum gaps for 401/500/503 are handled in #161.

### Files Updated
- `spec/unreleased/openapi/openapi.delegate_payment.yaml`
