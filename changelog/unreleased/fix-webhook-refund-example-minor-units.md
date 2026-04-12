## Fix webhook refund example minor units

Fix the `order_updated` example in the `2026-01-30` webhook OpenAPI snapshot so `Refund.amount` matches the schema definition.

### Changes
- Changed the inline webhook example from `amount: "1.00"` to `amount: 100`
- Kept the example aligned with the existing `Refund.amount` schema, which uses integer minor units

### Files Updated
- `spec/2026-01-30/openapi/openapi.agentic_checkout_webhook.yaml`

