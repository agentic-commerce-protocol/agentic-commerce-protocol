## Fix Delegate Authentication Result Schema Validation

Delegate authentication retrieve-session examples now validate against the
schema when they include an `authentication_result`.

### Changes
- Expanded example validation coverage for delegate authentication and feed
  examples.
- Fixed `DelegateAuthenticationSessionWithResult` so `authentication_result`
  is accepted alongside the base session fields.
- Applied the same schema correction to the 2026-04-17 version and unreleased
  version.

### Files Updated
- `scripts/validate-consistency.js`
- `spec/2026-04-17/json-schema/schema.delegate_authentication.json`
- `spec/2026-04-17/openapi/openapi.delegate_authentication.yaml`
- `spec/unreleased/json-schema/schema.delegate_authentication.json`
- `spec/unreleased/openapi/openapi.delegate_authentication.yaml`

### Reference
- PR: #<pr-number>
