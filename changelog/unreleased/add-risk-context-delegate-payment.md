## Add `risk_context` to delegate_payment

**Added** an optional `risk_context` object to `DelegatePaymentRequest`. Carries raw buyer/device telemetry (`ip_address`, `user_agent`, `accept_language`, `session_id`, `device_fingerprint`) using the same shape already defined for `complete_checkout.risk_signals`.

`risk_signals` continues to mean normalized fraud assessment output (`blocked` / `manual_review` / `authorized`). The new `risk_context` field carries the raw inputs that feed those assessments. Splitting the two avoids overloading `risk_signals` with telemetry and avoids using untyped `metadata` for fraud-relevant data.

Additive and backward-compatible: `risk_context` is optional, servers that do not recognize it must ignore it, clients targeting older API versions must omit it.

### Changes
- Added `RiskContext` schema definition
- Added optional `risk_context` field to `DelegatePaymentRequest`
- Updated request example to include `risk_context`
- Added §3.7 RiskContext to the RFC; renumbered Metadata to §3.8
- Clarified §3.6 (RiskSignal) to call out the split between assessment output and telemetry input

### Files Updated
- `rfcs/rfc.delegate_payment.md`
- `spec/unreleased/openapi/openapi.delegate_payment.yaml`
- `spec/unreleased/json-schema/schema.delegate_payment.json`
- `examples/unreleased/examples.delegate_payment.json`

### Reference
- SEP: #180
