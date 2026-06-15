## Validate OpenAPI inline examples against $ref schemas

`scripts/validate-consistency.js` did not walk OpenAPI `requestBody`/`responses` blocks to validate inline `examples:` against the schema referenced on the same `content[mediaType]` block. This is the gap noted in #243 that allowed the wrapped error-envelope bug to ship across six versions of `openapi.delegate_payment.yaml` without CI catching it.

This change adds that check only. The example fixes it surfaces are handled in separate, scoped PRs (see "Follow-up").

### Changes
- `scripts/validate-consistency.js`: added `validateOpenApiInlineExamples()` that walks `paths.*.<method>.requestBody|responses.*.content[mediaType]` blocks, resolves `schema.$ref` against the OpenAPI document's `#/components/schemas/*`, and validates every inline `example` and `examples[*].value` against it. OpenAPI 3.0 conventions (`exclusiveMinimum: true`, `nullable: true`) are normalized to JSON Schema 2020-12 before compiling with AJV. Cross-file `$ref`s and inline schemas (no `$ref`) are skipped — no false positives.
- Added `KNOWN_INLINE_EXAMPLE_FAILURES` allowlist for the pre-existing inline-example failures the new check surfaces but that are out of scope here. Each entry corresponds to a real bug in the spec (items→line_items rename in `CheckoutSessionCreateRequest` examples; missing `handler_id`/`option_id` required fields; webhook refund `amount` typed as string for older versions — same pattern as #249; `acquirer_bin` / `authentication_result` extra fields in `delegate_authentication` examples; `Error` enum gaps tracked in #161; and the released `delegate_payment` error-envelope wrappers unwrapped in the companion PR). Follow-up PRs remove entries as they fix the underlying examples.

### Verification
Before this change, the existing `validateExamples()` (covers `examples/<version>/examples.<spec>.json`) reports 0 errors but inline OpenAPI examples were never compared against their schemas. After this change the inline check runs across all versions and is green with the allowlist in place. `pnpm run compile:schema` and `pnpm run validate:all` both pass.

### Files Updated
- `scripts/validate-consistency.js`

### Follow-up
- Released-version follow-up to #243: unwrap the `error:` envelope in the five released `openapi.delegate_payment.yaml` files and remove the six corresponding allowlist entries.
- `Error` enum gaps for 401/429/500/503 tracked in #161.

### Reference
- PR: #243 (unreleased fix; commit message flagged the validator gap closed here)
- PR: #249 (same class of inline-example bug, fixed for 2026-01-30 webhook refund example)
- Issue: #161 (`Error` enum gaps for 401/500/503)
- Issue: #21 (original report of the envelope mismatch)
