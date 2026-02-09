# Unreleased Changes

## Deprecate `DiscountDetail` in Favor of `AppliedDiscount`

ACP had two overlapping discount representations with no spec guidance on their relationship: `DiscountDetail` in the base schema (5 fields, no RFC, no examples) and `AppliedDiscount` in the Discount Extension (11+ fields, full RFC, 5 examples). This change deprecates the under-specified type and clarifies the normative boundary for `AppliedDiscount`.

### Changes

- **JSON Schema**: Added `DEPRECATED` descriptions to `DiscountDetail` type and `discount_details` field on `LineItem` in `schema.agentic_checkout.json`.

- **OpenAPI**: Added `deprecated: true` and updated descriptions to `DiscountDetail` component and `discount_details` field in `openapi.agentic_checkout.yaml`.

- **Discount Extension RFC**: Added deprecation section (§10.2) following the `coupons` → `discounts.codes` pattern (§10.1), normative boundary language for `automatic: true` (§10.3), `DiscountDetail.source` mapping table, and before/after migration example.

### Behavioral Rules

- Merchants using the Discount Extension **SHOULD** use `discounts.applied[]` as the authoritative representation and **SHOULD** omit `discount_details[]`.
- When both `discount_details[]` and `discounts.applied[]` are present, `discounts.applied[]` takes precedence.
- Merchants not using the Discount Extension **MAY** continue to use `discount_details[]` during the deprecation period.
- The `DiscountDetail` type and `discount_details` field will be removed in a future spec version.

### Related

- Closes #124
