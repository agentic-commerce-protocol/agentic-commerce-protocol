## Require Signature (and Timestamp) on unreleased Delegate Payment / Authentication OpenAPI

`rfcs/rfc.delegate_payment.md` marks `Signature` and `Timestamp` as **REQUIRED**. `rfcs/rfc.delegate_authentication.md` §3.1 marks `Signature` as **REQUIRED**. Open PRs already align the dated `2026-04-17` OpenAPI snapshots; `spec/unreleased/` (current development, next release source) still had `required: false`, so codegen from unreleased would keep accepting unsigned money-path requests with only the static bearer key.

### Changes
- `spec/unreleased/openapi/openapi.delegate_payment.yaml`: set `Signature` and `Timestamp` `required: true` (RFC MUST).
- `spec/unreleased/openapi/openapi.delegate_authentication.yaml`: set `Signature` `required: true` (RFC MUST). Leave `Timestamp` optional (RFC RECOMMENDED).

### Reference
- Sibling of open PRs aligning the `2026-04-17` dated specs with the same RFC MUST language.
