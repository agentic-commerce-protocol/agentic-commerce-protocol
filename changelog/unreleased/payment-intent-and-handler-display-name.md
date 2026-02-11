# Payment intent (capture vs authorize) and PaymentHandler display_name

**Added** – optional fields for payment flow and UI. Backward compatible.

### Schema changes

- **PaymentHandler.display_name** — Optional human-readable name for the payment method (e.g. "Credit Card"). Used when showing payment options to the buyer; avoids displaying the handler’s technical `name` (e.g. `dev.acp.tokenized.card`).

- **PaymentData.capture_method** — Optional enum `"capture"` | `"authorize"`. When to charge: `capture` = charge immediately (default behavior when omitted); `authorize` = reserve funds only, capture later (e.g. when the order ships; on guest checkout). Enables B2B and merchant flows that need auth-now, capture-later. Aligns with Stripe’s capture_method.

### Files changed

- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `examples/unreleased/examples.agentic_checkout.json` — added `display_name` on handler examples
