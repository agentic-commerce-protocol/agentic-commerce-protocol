# Document `intervention_required` error code

**Fixed** – added `intervention_required` to the documented MessageError codes in `rfc.agentic_checkout.md`.

PR #118 added `intervention_required` to the MessageErrorCode enum in both OpenAPI and JSON Schema, but the RFC was not updated. This adds the missing documentation: when the code is used, how it relates to `capabilities.interventions`, and how it differs from `requires_3ds`.

**Files changed:** `rfcs/rfc.agentic_checkout.md`
