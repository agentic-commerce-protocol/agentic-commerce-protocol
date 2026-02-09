# Add error response and multi-item checkout examples

**Agentic Checkout API – Examples**

- **Error examples**: Added `error_400_invalid_item` (HTTP-level Error for invalid item ID), `checkout_session_with_out_of_stock` and `checkout_session_with_payment_declined` (CheckoutSession responses with `MessageError` in `messages` array).
  - `examples/unreleased/examples.agentic_checkout.json`
- **Multi-item checkout**: Added request and response examples for a checkout session with multiple line items, showing per-item `unit_amount` and `totals`.
  - `examples/unreleased/examples.multi_item_checkout.json`
