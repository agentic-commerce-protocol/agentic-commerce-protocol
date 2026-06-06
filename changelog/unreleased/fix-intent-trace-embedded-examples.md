## Correct field name in IntentTrace and CancelSessionRequest examples

The inline `example:` blocks on `IntentTrace` and `CancelSessionRequest` in `spec/unreleased/` used `description`, which is not a property of `IntentTrace` — the intended field is `trace_summary`. Renamed the field in both examples so they match the schema definition and the dedicated examples in `examples/<version>/examples.agentic_checkout.json`.

### Files Updated
- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
