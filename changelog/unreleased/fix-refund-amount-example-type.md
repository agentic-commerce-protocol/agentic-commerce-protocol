## Fix Refund amount example type in 2026-01-30 webhook spec

The `order_updated` example in `openapi.agentic_checkout_webhook.yaml` showed `amount: "1.00"` (string) for a refund. The `Refund.amount` schema in the same file defines `amount` as an `integer` in minor units (e.g. `100` cents for `$1.00`). The example contradicted the schema and could confuse implementers and tooling.

### Changes
- Corrected the refund example to use `amount: 100` (integer minor units, consistent with the schema and other examples in the file such as the `total` line item at line 117)

### Files Updated
- `spec/2026-01-30/openapi/openapi.agentic_checkout_webhook.yaml`

### Reference
- Issue: #220
