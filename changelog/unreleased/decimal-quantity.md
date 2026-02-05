# Decimal quantity support (B2B)

**Breaking change** – Item `quantity` field type change.

- **Quantity field**: Changed from `integer` to `number` (decimal) to support B2B commerce (e.g. items sold by weight or other fractional units). The field accepts decimal values greater than 0 (`exclusiveMinimum`).
- Updated in: `spec/2025-09-29/json-schema/schema.agentic_checkout.json`, `spec/2025-09-29/openapi/openapi.agentic_checkout.yaml`
- Examples updated to demonstrate decimal quantities (e.g. 2.5).
