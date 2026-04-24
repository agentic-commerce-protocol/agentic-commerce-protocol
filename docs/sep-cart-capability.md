# SEP: Cart Capability for Pre-Checkout Basket Building

## SEP Metadata

- **SEP Number**: #187
- **Status**: `proposal`
- **Type**: [x] Major Change [ ] Process Change
- **Related Issues/RFCs**: `rfcs/rfc.cart.md`

---

## Abstract

This SEP introduces a **Cart** capability to ACP -- a lightweight CRUD interface for pre-checkout basket building. Agents frequently build baskets incrementally ("add this, remove that, what's the total?") before the buyer expresses purchase intent. Today, ACP requires creating a full checkout session for this, which triggers capability negotiation, payment handler configuration, and status lifecycle management -- all unnecessary overhead for browsing.

The cart provides four endpoints (`POST /carts`, `GET /carts/{id}`, `PUT /carts/{id}`, `POST /carts/{id}/cancel`) with estimated pricing and session persistence. No new domain types are introduced; carts reuse existing ACP types (LineItem, Buyer, Total, Message).

---

## Motivation

ACP's checkout session is designed for purchase finalization, but agents need a pre-purchase exploration phase. Without a cart:

* **Agents must create heavyweight checkout sessions for browsing** -- triggering capability negotiation, payment handler setup, and status lifecycle for what is essentially adding items to a basket.
* **Agents must track items client-side** -- meaning the seller has no visibility into browsing behavior, cannot provide estimated pricing, and cannot validate item availability until checkout.
* **No session persistence** -- there's no way to save a basket across agent sessions or share it via a URL for human-in-the-loop flows.
* **No incremental building** -- the common pattern of "add this... add that... remove that... check out" doesn't map cleanly to checkout session semantics.

Carts solve these by providing a binary-state (exists / not found) resource with estimated totals, no payment configuration, and no status lifecycle. The typical flow becomes: cart (browsing) -> checkout session (purchasing) -> order.

---

## Specification

This PR includes the following spec changes:

**New files:**

* `rfcs/rfc.cart.md` -- Full RFC with design, operations, schema, and conformance checklist
* `spec/unreleased/json-schema/schema.cart.json` -- Cart, CartCreateRequest, CartUpdateRequest schemas (all referencing existing ACP types via `$ref`)
* `spec/unreleased/openapi/openapi.cart.yaml` -- OpenAPI 3.1 for 4 REST endpoints
* `changelog/unreleased/cart.md` -- Changelog entry

**Modified files:**

* `spec/unreleased/json-schema/schema.agentic_checkout.json` -- Added `"carts"` to discovery services enum
* `rfcs/rfc.discovery.md` -- Added `"carts"` to services enum table and example

**Key design decisions:**

* **4 operations**: Create (`POST /carts`), Get (`GET /carts/{id}`), Update (`PUT /carts/{id}`), Cancel (`POST /carts/{id}/cancel`)
* **Full replacement on update** -- matches existing ACP checkout update semantics
* **Estimated (non-authoritative) pricing** -- totals on a cart are estimates; authoritative pricing comes at checkout
* **Session persistence** -- carts survive across agent sessions and can be shared via `continue_url`
* **No capabilities, no payment, no status lifecycle** -- these are checkout concerns
* **Binary state** -- a cart either exists or returns 404; there is no status machine

**Cart response object fields:**

* `id` (required) -- server-generated unique identifier
* `line_items` (required) -- reuses existing ACP LineItem type
* `buyer` (optional) -- reuses existing ACP Buyer type
* `currency` (required) -- ISO 4217 currency code, determined by seller
* `totals` (required) -- estimated cost breakdown (subtotal, tax if calculable, total)
* `messages` (optional) -- MessageInfo, MessageWarning, MessageError
* `continue_url` (optional) -- URI for cart handoff/session recovery
* `expires_at` (optional) -- RFC 3339 expiry timestamp

**Deferred to follow-up SEPs:**

* **Cart-to-checkout conversion** via a `cart_id` field on `CheckoutSessionCreateRequest` -- agents currently convert carts to checkouts manually by reading the cart and creating a checkout session with the retrieved items
* **Extension support** (e.g., discount codes during browsing) -- agents can apply discounts at checkout time instead

This SEP establishes the core cart resource; conversion and extension semantics will build on it additively.

---

## Rationale

**Why a separate resource instead of a "lightweight checkout"?**
Overloading checkout with a "pre-payment" mode would complicate the status lifecycle and capability negotiation contract. A separate cart resource with no status machine is simpler for both implementers and agents.

**Why full replacement instead of partial updates (add/remove item)?**
Consistent with ACP's existing checkout update pattern. Full replacement is simpler to implement and avoids the complexity of item-level CRUD operations (add, remove, change quantity as separate calls). The agent always has the full desired state and sends it.

**Why reuse existing types instead of cart-specific types?**
Carts and checkouts share the same commerce domain (items, buyers, totals). Reusing types via `$ref` ensures consistency and reduces the schema surface area.

**Why is `currency` not required on cart create (unlike checkout)?**
Carts are lightweight. The seller determines currency from context (locale, buyer location) or defaults. Requiring currency upfront adds friction for browsing. Currency is always present on the response (determined by the seller).

**Why defer cart-to-checkout conversion?**
Keeping the initial SEP focused on the core CRUD resource reduces scope and implementation complexity. The manual conversion path (read cart, create checkout with items) works today. A `cart_id` field on checkout create can be added additively in a follow-up SEP without breaking changes.

---

## Backward Compatibility

This is a purely additive change with no breaking changes:

* New endpoints (`/carts/*`) do not conflict with existing paths.
* `"carts"` in the discovery services enum is a new value; existing values are unaffected.
* Cart is an optional service; sellers that don't implement it simply omit `"carts"` from their discovery document.

No deprecation or migration is needed.

---

## Reference Implementation

Not yet available. The RFC and schema definitions in this PR serve as the specification from which implementations can be built.

---

## Security Implications

* **Authentication**: Cart endpoints use the same `Authorization: Bearer` mechanism as checkout. No new auth flows are introduced.
* **Data privacy**: Carts carry buyer email and item data, same sensitivity as checkout sessions. No additional PII exposure.
* **Cart enumeration**: Cart IDs are server-generated opaque strings. Sequential or predictable IDs SHOULD be avoided to prevent enumeration.
* **Expiry**: Carts support `expires_at` to prevent indefinite data retention. Sellers SHOULD set reasonable TTLs.

---

## Pre-Submission Checklist

- [x] I have created a GitHub Issue with the `SEP` and `proposal` tags
- [x] I have linked the SEP issue number above
- [x] I have discussed this proposal in the community (Discord/GitHub Discussions)
- [x] I have signed the Contributor License Agreement (CLA)
- [x] This PR includes updates to OpenAPI/JSON schemas
- [x] This PR includes example requests/responses (in the RFC and OpenAPI)
- [x] This PR includes a changelog entry file in `changelog/unreleased/cart.md`
- [x] I am seeking or have found a sponsor (Founding Maintainer)

---

## Additional Context

The cart capability was designed based on common agent interaction patterns observed in early ACP implementations, where agents frequently needed to build baskets incrementally before committing to a purchase. The design prioritizes simplicity and reuse of existing ACP types to minimize the implementation surface area for sellers.

The scope was intentionally narrowed to focus on the core cart CRUD resource. Cart-to-checkout conversion (`cart_id` on checkout create) and extension support (e.g., discounts on carts) are deferred to follow-up SEPs that will build on this foundation additively.

---

## Questions for Reviewers

1. **Update semantics**: Should cart update be `POST` (matching checkout) or `PUT` (more RESTful for full replacement)? The current proposal uses `POST` for consistency with ACP's existing patterns.
2. **Cart expiry defaults**: Should the spec recommend a default TTL (e.g., 24 hours, 7 days), or leave this entirely to the seller?
3. **Conversion path**: Is the manual cart-to-checkout conversion (read cart, create checkout) sufficient for the initial release, or should `cart_id` conversion be included in this SEP?
