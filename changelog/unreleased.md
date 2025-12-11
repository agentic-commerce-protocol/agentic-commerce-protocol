# Unreleased Changes

## Bug Fixes

### Fix Fulfillment Amount Types in OpenAPI Specification

**Fixed inconsistency in OpenAPI spec where fulfillment option amounts were incorrectly typed as strings instead of integers.**

In the OpenAPI specification (`spec/openapi/openapi.agentic_checkout.yaml`), the `subtotal`, `tax`, and `total` fields in both `FulfillmentOptionShipping` and `FulfillmentOptionDigital` schemas were defined as `type: string`. This was inconsistent with:

- The JSON Schema (`spec/json-schema/schema.agentic_checkout.json`) which defines them as `type: integer`
- The RFC documentation which explicitly states: "Amounts **MUST** be integers in minor units"
- The example files which show these values as numeric (unquoted) integers
- The `Total` schema which correctly defines the `amount` field as `type: integer`

**Changes:**
- Changed `subtotal`, `tax`, and `total` from `type: string` to `type: integer` in `FulfillmentOptionShipping`
- Changed `subtotal`, `tax`, and `total` from `type: string` to `type: integer` in `FulfillmentOptionDigital`

**Impact:**
This is a **clarification/bug fix**, not a breaking change. The specification has always required integer amounts in minor units (per the RFC), and all examples demonstrate integer usage. Implementations following the RFC and examples should already be using integers, so this change aligns the OpenAPI schema with the actual specification behavior.

If any implementation was incorrectly sending/receiving these values as quoted strings (e.g., `"100"` instead of `100`), they should update to use numeric integers to comply with the specification.
