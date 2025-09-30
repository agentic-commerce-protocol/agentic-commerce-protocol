# Unreleased Changes

## Breaking Changes

- **Item quantity field type change**: Changed `quantity` field from `integer` to `number` (decimal) to support B2B commerce use cases where items are sold by weight (e.g., kilograms) or other fractional units of measurement. The field now accepts decimal values greater than 0 (exclusive minimum).
  - Updated in `spec/json-schema/schema.agentic_checkout.json`
  - Updated in `spec/openapi/openapi.agentic_checkout.yaml`
  - Examples updated to demonstrate decimal quantities (e.g., 2.5 kg)