# Fix schema consistency between JSON Schema and OpenAPI

**Fixed** — two spec drift issues between JSON Schema and OpenAPI.

### DiscountsResponse missing `rejected` array in JSON Schema

The OpenAPI spec and the discount extension schema (`schema.discount.json`) both define a `rejected` array on `DiscountsResponse` with `RejectedDiscount` items. The main JSON schema (`schema.agentic_checkout.json`) was missing it — only had `codes` and `applied`.

Added `rejected` array, `RejectedDiscount` type, and `DiscountErrorCode` enum to the main JSON schema to match the OpenAPI spec.

### `frictionless` flow_preference missing properties in OpenAPI

The JSON schema defines `frictionless.properties.type` with enum `["low_risk"]` on `AuthenticationMetadata.flow_preference`. The OpenAPI spec had `frictionless` as an empty object with `additionalProperties: false` and no properties.

Added the `type` property with `low_risk` enum to the OpenAPI `frictionless` object to match the JSON schema.

### Files changed

- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
