# Unreleased Changes

## Added

### Message Resolution Field

Added optional `resolution` field to `MessageInfo`, `MessageWarning`, and `MessageError` schemas. This field indicates who is responsible for resolving the message:

- `recoverable`: Agent can fix via API (e.g., retry with different parameters)
- `requires_buyer_input`: Buyer must provide information the API cannot collect programmatically (checkout incomplete)
- `requires_buyer_review`: Buyer must authorize before order placement due to policy, regulatory, or entitlement rules (checkout complete)

This enables agents to make informed decisions about whether to attempt automated recovery or escalate to the buyer.

**Files changed:**
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `rfcs/rfc.agentic_checkout.md`
- `examples/discount-extension/rejected-discount-code.json`

---

## Previous Releases

- [Version 2026-01-30](./2026-01-30.md) - Extensions Framework, Discount Extension, and Payment Handlers
- Version 2026-01-22 - Enhanced Checkout Capabilities
- Version 2026-01-16 - Capability Negotiation and Supported Card Networks
- Version 2025-12-12 - Fulfillment Enhancements and Affiliate Attribution
- Version 2025-12-11 - Type Fixes and Link Types
- Version 2025-09-29 - Initial Release
