## Unwrap error envelope in released delegate_payment OpenAPI examples

Released-version follow-up to #243. #243 unwrapped the `error:` envelope from the inline error response examples in `spec/unreleased/openapi/openapi.delegate_payment.yaml` and noted the same wrapper bug existed in the released versions, to be handled in a follow-up. This is that follow-up.

`Error` is `additionalProperties: false` with `type`, `code`, `message` required at the top level, so the wrapped `{ error: { ... } }` examples never validated against the schema they `$ref`. This change removes the wrapper from the affected response examples. Only the wrapper is removed — no `type`, `code`, `message`, or `param` values are changed.

### Changes
Unwrapped the `error:` envelope in error response examples across the five released `openapi.delegate_payment.yaml` files (7 each in 2025-09-29, 2025-12-12, 2026-01-16, 2026-01-30; 9 in 2026-04-17). Identical mechanical change to PR #243, applied to released versions.

### Files Updated
- `spec/2025-09-29/openapi/openapi.delegate_payment.yaml`
- `spec/2025-12-12/openapi/openapi.delegate_payment.yaml`
- `spec/2026-01-16/openapi/openapi.delegate_payment.yaml`
- `spec/2026-01-30/openapi/openapi.delegate_payment.yaml`
- `spec/2026-04-17/openapi/openapi.delegate_payment.yaml`

### Notes
After this change, the `invalid_request`-typed examples validate cleanly against `Error`. The 401/429/500/503 examples remain non-validating only because of `Error.type`/`code` enum gaps tracked in #161. The inline-example validator that detects this class of bug is added in a companion PR; once both land, its six `delegate_payment|#/components/schemas/Error|*` allowlist entries for the unwrapped examples can be removed.

### Reference
- PR: #243 (unreleased fix; deferred the released versions to this follow-up)
- Issue: #161 (`Error` enum gaps for 401/429/500/503)
- Issue: #21 (original report of the envelope mismatch)
