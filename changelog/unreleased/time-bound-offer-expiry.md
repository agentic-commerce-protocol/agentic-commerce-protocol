## Time-bound offer expiry: line-item valid_until and booking semantics

Adds first-class support for time-bound products (e.g. flight offers, booking holds) so merchants can express offer/price expiry at line-item level and agents can handle quote and offer expiration consistently.

### Changes

- **LineItem**
  - **`valid_until`** (optional, RFC 3339 date-time): When this offer/price expires. After this time the merchant may reject completion or reprice. Distinct from session-level `quote_expires_at`.
- **availability_status**
  - **`offer_valid`**: Time-bound offer is still valid (e.g. flight/booking offer).
  - **`offer_expired`**: Time-bound offer has expired; price/availability may have changed.
- **MessageError.code**
  - **`offer_expired`**: A line item's offer has expired; agent may refresh that item or quote.
  - **`quote_expired`**: The session quote has expired; agent should create a new session/quote.
- **RFC**
  - New section **5.1 Time-bound offers and booking flows** in `rfc.agentic_checkout.md` describing quote vs line-item expiry, when to use `fulfillable_on` vs `valid_until`, and message codes for offer/quote expiry.

### Files Updated

- `spec/unreleased/openapi/openapi.agentic_checkout.yaml` — LineItem `valid_until`, availability_status enum, MessageError code enum
- `spec/unreleased/json-schema/schema.agentic_checkout.json` — same
- `rfcs/rfc.agentic_checkout.md` — Data model extract, new §5.1, Message (error) codes
- `examples/unreleased/examples.agentic_checkout.json` — new examples `checkout_session_response_time_bound_offer`, `checkout_session_message_offer_expired`
