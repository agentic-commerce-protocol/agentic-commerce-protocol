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
- **CartCreateRequest**: `line_items` (required), `buyer`, `locale`, `discounts`, `metadata`.
- **CartUpdateRequest**: `line_items` (required), `buyer`, `discounts`.

## Cart-to-Checkout Conversion

- **`cart_id`** added as an optional field on `CheckoutSessionCreateRequest`. When present,
  the seller initializes the checkout session from the cart's line items and buyer information.
- Conversion is idempotent: if an incomplete checkout already exists for the given `cart_id`,
  the seller returns the existing session.

## Discovery Integration

- **`"carts"`** added to the `capabilities.services` enum in the discovery document
  (`/.well-known/acp.json`). Agents check for `"carts"` before attempting cart operations.

## Design Notes

- Carts have no status lifecycle — they either exist or return 404.
- Carts have no capability negotiation — that occurs at checkout creation time.
- Carts have no payment data — payment is a checkout concern.
- Totals on carts are estimates (e.g., tax may be omitted if address is unknown).
- Carts support the discount extension for applying codes during browsing.

**Files changed:**

- `spec/unreleased/json-schema/schema.cart.json` (new)
- `spec/unreleased/openapi/openapi.cart.yaml` (new)
- `spec/unreleased/json-schema/schema.agentic_checkout.json` (cart_id on checkout create, carts in discovery services)
- `rfcs/rfc.cart.md` (new)
- `rfcs/rfc.discovery.md` (carts in services enum)
