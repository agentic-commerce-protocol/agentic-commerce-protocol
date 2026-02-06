## Fix incorrect fulfillment values in complete and cancel response examples

The complete and cancel response examples incorrectly showed Standard shipping values (`fulfillment_option_123`, cost 100, total 430) after the update example switched to Express shipping (`fulfillment_option_456`, cost 500, total 830). Fixed to be consistent with the preceding update response.

### Changes
- Fixed `selected_fulfillment_options`, fulfillment amount, and total in complete response example (RFC section 9.6)
- Fixed fulfillment amount and total in cancel response example (RFC section 9.8)
- Applied same fixes to `examples/unreleased/examples.agentic_checkout.json`

### Files Updated
- `rfcs/rfc.agentic_checkout.md`
- `examples/unreleased/examples.agentic_checkout.json`

### Reference
- Issue: #16
