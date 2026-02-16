# PaymentHandler display_name

**Added** – optional field for payment UI. Backward compatible.

### Schema changes

- **PaymentHandler.display_name** — Optional human-readable name for the payment method (e.g. "Credit Card", "PayPal"). Used when showing payment options to the buyer; avoids displaying the handler’s technical `name` (e.g. `dev.acp.tokenized.card`).

### Deferred (not in this PR)

- **PaymentData.capture_method** — Deferred until the protocol defines payment lifecycle (capture/void/refund) so that when `manual` (auth-only) is used, the agent has a capture path and visibility (e.g. capture endpoint or webhook). Without that, the field would open a state the agent cannot resolve. To be revisited in a future SEP (e.g. orders #106 or a companion payment-lifecycle SEP).

### Files changed

- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml` — added `display_name` on PaymentHandler
- `examples/unreleased/examples.agentic_checkout.json` — added `display_name` on handler examples
