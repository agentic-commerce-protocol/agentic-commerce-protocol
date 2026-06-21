# Document all 11 session states

**Fixed** – added §5.1 Session Status Reference to `rfc.agentic_checkout.md` documenting all 11 `CheckoutSessionBase.status` values. Previously only 6 were documented; `incomplete`, `requires_escalation`, `pending_approval`, `complete_in_progress`, and `expired` had no semantic documentation.

Also fixes stale inline status enums in §4.1 and §8 that listed only 5 values, and adds `description` fields to the status enum in both OpenAPI and JSON Schema.

**Files changed:** `rfcs/rfc.agentic_checkout.md`, `spec/unreleased/openapi/openapi.agentic_checkout.yaml`, `spec/unreleased/json-schema/schema.agentic_checkout.json`
