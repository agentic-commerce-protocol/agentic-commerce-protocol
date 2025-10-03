- **2025-10-03**: Fixed `subtotal`, `tax`, and `total` fields in `FulfillmentOptionShipping` and `FulfillmentOptionDigital` schemas from `spec/openapi/openapi.agentic_checkout.yaml`

Previously they were type `string`, now they are type `integer`

This aligns with the conformance checklist to use **integer** minor units for all monetary amounts and the json schema
