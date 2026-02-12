# Payment handler display order

**Added** – Optional `display_order` on each payment handler in `capabilities.payment.handlers`.

Sellers can suggest a preferred display order for payment methods (lower value = higher preference). The ordering is **suggestive**: platforms and agents MAY reorder (e.g. for user preference or localization). This lets sellers express their fraud vs. conversion preferences so agents have a standard hint when presenting payment options.

**Backward compatible:** Optional field; existing implementations ignore unknown properties. No breaking changes.

**RFC:** `rfcs/rfc.payment_handlers.md`  
**Schema:** `spec/unreleased/json-schema/schema.agentic_checkout.json`, `spec/unreleased/openapi/openapi.agentic_checkout.yaml`  
**Examples:** `examples/unreleased/examples.agentic_checkout.json`
