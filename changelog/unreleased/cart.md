# Cart Capability

**Added** -- pre-checkout cart management for incremental basket building.

## New Endpoints

- **`POST /carts`** -- Create a new cart with line items and optional buyer information.
- **`GET /carts/{id}`** -- Retrieve the current state of a cart.
- **`POST /carts/{id}`** -- Update a cart (full replacement of line items).
- **`POST /carts/{id}/cancel`** -- Cancel a cart and return its final state.

## New Schemas

- **Cart**: Response object with `id`, `line_items`, `buyer`, `currency`, `totals`, `messages`,
  `continue_url`, and `expires_at`. Reuses existing ACP types (LineItem, Buyer, Total, Message).
- **CartCreateRequest**: `line_items` (required), `buyer`, `locale`.
- **CartUpdateRequest**: `line_items` (required), `buyer`.

## Discovery Integration

- **`"carts"`** added to the `capabilities.services` enum in the discovery document
  (`/.well-known/acp.json`). Agents check for `"carts"` before attempting cart operations.

## Design Notes

- Carts are scoped to a single seller.
- Carts have no status lifecycle — they either exist or return 404.
- Carts have no capability negotiation — that occurs at checkout creation time.
- Carts have no payment data — payment is a checkout concern.
- Totals on carts are estimates (e.g., tax may be omitted if address is unknown).
- Cart-to-checkout conversion (via `cart_id`) and extension support (e.g., discounts) are deferred to follow-up SEPs.

**Files changed:**

- `spec/unreleased/json-schema/schema.cart.json` (new)
- `spec/unreleased/openapi/openapi.cart.yaml` (new)
- `spec/unreleased/json-schema/schema.agentic_checkout.json` (carts in discovery services enum)
- `rfcs/rfc.cart.md` (new)
- `rfcs/rfc.discovery.md` (carts in services enum)
