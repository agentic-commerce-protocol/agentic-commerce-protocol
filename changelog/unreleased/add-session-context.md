## Add `session_context` (delegate_payment) and rename `risk_signals` object on complete_checkout to `session_context`

Unifies the way ACP carries raw buyer/device telemetry across endpoints and removes a name collision.

**Before**
- `complete_checkout.risk_signals` was an **object** with `ip_address`, `user_agent`, `accept_language`, `session_id`, `device_fingerprint` (raw telemetry).
- `delegate_payment.risk_signals` was an **array** of normalized fraud assessment results (`type`, `score`, `action`).
- Same field name, two different schemas across endpoints — confusing for implementers.
- `delegate_payment` had no typed place to forward raw telemetry, forcing platforms to use untyped `metadata`.

**After**
- `complete_checkout.session_context` (object) — raw buyer/device telemetry. Renamed from `risk_signals`; same shape, same semantics.
- `delegate_payment.session_context` (object, OPTIONAL) — raw buyer/device telemetry. New field, identical shape to `complete_checkout.session_context`.
- `delegate_payment.risk_signals` (array) — unchanged; continues to carry normalized fraud assessment output.

Naming follows feedback on SEP #180: the data is session-scoped telemetry that has uses beyond fraud (analytics, attribution, abuse detection), so the more general `session_context` is preferred over `risk_context` / `risk_signals` for this object.

### Compatibility

- The `delegate_payment.session_context` field is additive and OPTIONAL. Servers that do not recognize it MUST ignore it. Clients targeting older API versions MUST omit it.
- The `complete_checkout` rename only affects the **unreleased** spec version. Released versions (`2025-09-29`, `2025-12-12`, `2026-01-16`, `2026-01-30`, `2026-04-17`) continue to expose the field as `risk_signals` and are not modified by this change. Implementations SHOULD migrate to `session_context` when adopting the next published version.

### Changes
- Added `SessionContext` schema and optional `session_context` field to `DelegatePaymentRequest`.
- Renamed `RiskSignals` schema to `SessionContext` and field `risk_signals` to `session_context` on `CheckoutSessionCompleteRequest`.
- Added §3.7 SessionContext to the `delegate_payment` RFC; renumbered Metadata to §3.8.
- Clarified §3.6 (RiskSignal) on `delegate_payment` to call out the split between assessment output (array) and telemetry input (object).
- Added Change Log entries for both endpoints.
- Updated all `unreleased` examples and the request example in the `delegate_payment` RFC §8.1.

### Files Updated
- `rfcs/rfc.delegate_payment.md`
- `rfcs/rfc.agentic_checkout.md`
- `spec/unreleased/openapi/openapi.delegate_payment.yaml`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
- `spec/unreleased/json-schema/schema.delegate_payment.json`
- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `examples/unreleased/examples.delegate_payment.json`

### Reference
- SEP: #180
- PR review: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/pull/238#pullrequestreview-4216994134
