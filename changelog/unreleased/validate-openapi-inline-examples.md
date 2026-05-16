## Validate OpenAPI inline examples against $ref schemas

`scripts/validate-consistency.js` did not walk OpenAPI `requestBody`/`responses` blocks to validate inline `examples:` against the schema referenced on the same `content[mediaType]` block. This is the gap noted in #243 that allowed the wrapped error-envelope bug to ship across six versions of `openapi.delegate_payment.yaml` without CI catching it.

This change adds that check, then applies the follow-up #243 committed to: unwrap the `error:` envelope in the five released `openapi.delegate_payment.yaml` files (2025-09-29, 2025-12-12, 2026-01-16, 2026-01-30, 2026-04-17). `Error` is `additionalProperties: false` with `type`, `code`, `message` required at the top level; the wrapped examples never validated against the schema they referenced.

### Changes
- `scripts/validate-consistency.js`: added `validateOpenApiInlineExamples()` that walks `paths.*.<method>.requestBody|responses.*.content[mediaType]` blocks, resolves `schema.$ref` against the OpenAPI document's `#/components/schemas/*`, and validates every inline `example` and `examples[*].value` against it. OpenAPI 3.0 conventions (`exclusiveMinimum: true`, `nullable: true`) are normalized to JSON Schema 2020-12 before compiling with AJV. Cross-file `$ref`s and inline schemas (no `$ref`) are skipped — no false positives.
- Unwrapped the `error:` envelope in 37 error response examples across the five released `openapi.delegate_payment.yaml` files (7 each in 2025-09-29, 2025-12-12, 2026-01-16, and 2026-01-30; 9 in 2026-04-17). Identical mechanical change to PR #243, applied to released versions.
- Added `KNOWN_INLINE_EXAMPLE_FAILURES` allowlist for 14 pre-existing inline-example failures that the new check surfaces but that are out of scope here. Each entry corresponds to a real bug in the spec (items→line_items rename in `CheckoutSessionCreateRequest` examples; missing `handler_id`/`option_id` required fields; webhook refund `amount` typed as string for older versions — same pattern as #249; `acquirer_bin` / `authentication_result` extra fields in `delegate_authentication` examples; `Error` enum gaps tracked in #161). Follow-up PRs should remove entries as they fix the underlying examples.

### Verification
Before this change, the existing `validateExamples()` (covers `examples/<version>/examples.<spec>.json`) reports 0 errors but inline OpenAPI examples were never compared against their schemas. After this change:

| | Errors found | After fixes in this PR |
|---|---|---|
| Inline examples checked | 151 across 6 versions | same |
| Failing | 68 | 0 (37 fixed, 31 allowlisted for follow-up) |

`pnpm run compile:schema` and `pnpm run validate:all` both pass.

### Files Updated
- `scripts/validate-consistency.js`
- `spec/2025-09-29/openapi/openapi.delegate_payment.yaml`
- `spec/2025-12-12/openapi/openapi.delegate_payment.yaml`
- `spec/2026-01-16/openapi/openapi.delegate_payment.yaml`
- `spec/2026-01-30/openapi/openapi.delegate_payment.yaml`
- `spec/2026-04-17/openapi/openapi.delegate_payment.yaml`

### Reference
- PR: #243 (unreleased fix; commit message flagged the validator gap closed here)
- PR: #249 (same class of inline-example bug, fixed for 2026-01-30 webhook refund example)
- Issue: #161 (`Error` enum gaps for 401/500/503)
- Issue: #21 (original report of the envelope mismatch)
