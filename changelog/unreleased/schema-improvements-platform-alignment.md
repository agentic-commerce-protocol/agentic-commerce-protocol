# Agentic Checkout schema improvements (platform alignment)

**Added / Changed** – schema updates to align with common patterns. All new fields are optional; backward compatible.

### Fixes

- **Duplicate key:** Removed duplicate `fulfillment_groups` property in `CheckoutSessionBase` (invalid JSON; only one occurrence retained).

### Schema changes

- **Address:** Added description on `country` recommending ISO 3166-1 alpha-2 (e.g. `US`, `GB`) for interoperability. Added optional `company` for B2B and shipping address.
- **FulfillmentDetails.phone_number:** Added description recommending E.164 format for global and carrier interoperability.
- **Order notes:** Added optional `order_notes` (string, maxLength 5000) to `CheckoutSessionCreateRequest`, `CheckoutSessionUpdateRequest`, and `CheckoutSessionCompleteRequest` for delivery instructions, gift messages, and customer comments.
- **OrderConfirmation:** Added optional `order_notes` to echo order notes on confirmation.
- **Order:** Added description on `order_number` (human-readable display number). Added optional `client_reference_id`: reference provided by the client (agent/platform) when completing checkout; the merchant stores it on the order and returns it so the platform can reconcile its transaction (e.g. `platform_txn_abc789`) with the merchant order (e.g. `ord_xyz`) for support, refunds, or analytics. Aligns with Stripe’s `client_reference_id` (the client provides the value, the merchant stores it).

### Descriptions added (developer clarity)

Schema descriptions were added so developers can clearly tell the Order identifiers apart:

- **Order.id** — “Merchant’s unique order id (assigned when the order is created). Use for API calls, permalink, and webhooks.” Distinguishes the merchant’s canonical order id from the session id and from any client reference.
- **Order.checkout_session_id** — “Id of the checkout session that created this order. Links the order back to the agentic checkout flow.” Makes the order–session relationship explicit.
- **Order.client_reference_id** — Short description in the schema (“Reference from the client (agent/platform) stored on the order for reconciliation…”); fuller explanation and marketplace example are in this changelog so the schema stays concise.

### Files changed

- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `examples/unreleased/examples.agentic_checkout.json` — added `company`, `order_notes`, `order_number`, `client_reference_id`, and `confirmation.order_notes` to relevant examples
