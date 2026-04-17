# Version 2026-04-17

This release promotes the accumulated unreleased ACP changes since 2026-01-30.

## Version Compatibility

- API Version: `2026-04-17`
- Previous version `2026-01-30` deprecated

## Included Changes

### Additional 3DS authentication flow examples

Added examples for 3DS authentication outcomes that complement the consumer authentication SEP (PR #53).

#### Changes
- `authentication_result_denied_example`: Failed authentication with `outcome: "denied"`
- `authentication_result_frictionless_example`: Frictionless flow with `outcome: "attempt_acknowledged"`
- `complete_session_with_denied_authentication_request`: Complete request showing how to handle denied authentication

#### Files Updated
- `examples/unreleased/examples.agentic_checkout.json`

#### Reference
- Issue: #55
- Related: PR #53 (consumer authentication SEP)

---

### Add error response and multi-item checkout examples

**Agentic Checkout API – Examples**

- **Error examples**: Added `error_400_invalid_item` (HTTP-level Error for invalid item ID), `checkout_session_with_out_of_stock` and `checkout_session_with_payment_declined` (CheckoutSession responses with `MessageError` in `messages` array).
  - `examples/unreleased/examples.agentic_checkout.json`
- **Multi-item checkout**: Added request and response examples for a checkout session with multiple line items, showing per-item `unit_amount` and `totals`.
  - `examples/unreleased/examples.multi_item_checkout.json`

---

### Feed API

**Added** – an unreleased Feed API surface for feed metadata and product catalog management.

### New API Surface

These endpoints are hosted by Agents and called by merchants. The Feed API is a
push model: merchants push product catalog metadata and product records to
Agents, rather than Agents pulling catalog data from merchant-hosted endpoints.

- `POST /feeds` for merchants to create feed metadata on an Agent-hosted feed service
- `GET /feeds/{id}` for merchants to retrieve feed metadata from the Agent
- `GET /feeds/{id}/products` for merchants to retrieve the current Agent-hosted product set
- `PATCH /feeds/{id}/products` for merchants to partially upsert products by `Product.id` into the Agent-hosted feed

### File Ingestion Format

- `metadata.json` uses the `FeedMetadata` shape
- `products.jsonl` contains one `Product` object per line
- file ingestion performs full replacement of the feed's product set
- partial updates are only supported through `PATCH /feeds/{id}/products`

### Deferred

- promotions are intentionally deferred to a stacked follow-up PR

---

### Add `supported_versions` Field to Version Mismatch Error Responses

When an ACP server rejects a request due to missing or unsupported `API-Version` header, agents previously had no programmatic way to discover which versions the server supports. This change adds guidance and schema support for a `supported_versions` array in error responses.

#### Changes

- **RFC Documentation**: Added guidance to Section 2.1 (Initialization) in both `rfc.agentic_checkout.md` and `rfc.delegate_payment.md` specifying that servers **SHOULD** include `supported_versions` array when rejecting version-related requests, and **MAY** use `unsupported_api_version` or `missing_api_version` as well-known error codes.

- **Schema Updates**: Added optional `supported_versions` field to the `Error` schema in both `schema.agentic_checkout.json` and `schema.delegate_payment_schema.json`.

#### Example Error Response

```json
{
  "type": "invalid_request",
  "code": "unsupported_api_version",
  "message": "API version '2025-01-01' is not supported",
  "supported_versions": ["2026-01-30", "2025-09-29"]
}
```

#### Benefits

- Agents can programmatically discover supported versions and retry
- Enables version negotiation without out-of-band discovery
- Low implementation burden (optional field)
- Fully backward compatible

#### Related

- Closes issue #95

---

### Allow empty risk_signals array

The current implementation of `delegate_payment` does not always provide an array of at least size 1 in the `risk_signals` array.

#### Changes

- **Risk signals:** `minItems` of `1` on the `risk_signals` field is removed.

#### Breaking Changes

None.

#### Files Updated

- `spec/unreleased/json-schema/schema.delegate_payment.json`
- `spec/unreleased/openapi/openapi.delegate_payment.yaml`

---

### Cart Capability

**Added** -- pre-checkout cart management for incremental basket building.

### New Endpoints

- **`POST /carts`** -- Create a new cart with line items and optional buyer information.
- **`GET /carts/{id}`** -- Retrieve the current state of a cart.
- **`PUT /carts/{id}`** -- Update a cart (full replacement of line items).
- **`POST /carts/{id}/cancel`** -- Cancel a cart and return its final state.

### New Schemas

- **Cart**: Response object with `id`, `line_items`, `buyer`, `currency`, `totals`, `messages`,
  `continue_url`, and `expires_at`. Reuses existing ACP types (LineItem, Buyer, Total, Message).
- **CartCreateRequest**: `line_items` (required), `buyer`, `locale`.
- **CartUpdateRequest**: `line_items` (required), `buyer`.

### Discovery Integration

- **`"carts"`** added to the `capabilities.services` enum in the discovery document
  (`/.well-known/acp.json`). Agents check for `"carts"` before attempting cart operations.

### Design Notes

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

---

### Decimal quantity support (B2B)

**Breaking change** – Item `quantity` field type change.

- **Quantity field**: Changed from `integer` to `number` (decimal) to support B2B commerce (e.g. items sold by weight or other fractional units). The field accepts decimal values greater than 0 (`exclusiveMinimum`).
- Updated in: `spec/2025-09-29/json-schema/schema.agentic_checkout.json`, `spec/2025-09-29/openapi/openapi.agentic_checkout.yaml`
- Examples updated to demonstrate decimal quantities (e.g. 2.5).

---

### Delegate Authentication

This RFC defines a standardized REST API contract for **delegated consumer authentication**. It enables agents to execute 3DS2 browser-based authentication directly with merchant specified authentication providers.

#### Changes

- **Delegate Authentication API**: Established a session-based authentication lifecycle (Create → Authenticate → Retrieve) to manage 3DS2 states across asynchronous browser actions.
- **Data Models**: Defined schemas for `PaymentMethod`, `BrowserInfo` and `AuthenticationResult` (Cryptograms and ECI).
- **Webhook Definitions**: Added support for asynchronous notifications, including Fingerprint completion, Challenge results, and an optional RReq webhook to prevent browser-to-backend race conditions.

#### Benefits

- **Standardization**: Provides a single contract for agents to interact with any compliant 3DS2 provider.

#### Files Created
- `rfcs/rfc.delegate_authentication.md`
- `spec/unreleased/json-schema/schema.delegate_authentication.json`
- `spec/unreleased/openapi/openapi.delegate_authentication.yaml`
- `examples/unreleased/examples.delegate_authentication.json`

---

### Discovery Well-Known Document

**Added** -- discovery document at `/.well-known/acp.json` for pre-session capability checks.

### New Document

- **`/.well-known/acp.json`** -- A static, publicly accessible JSON document served at the origin
  root per RFC 8615. Enables agents to determine ACP support, discover the API base URL, check
  version compatibility, and learn available capabilities before creating a checkout session.

### New Schemas

- **DiscoveryResponse**: Top-level document containing protocol metadata, API base URL, supported
  transports, and a capabilities object.
- **DiscoveryCapabilities**: Seller capabilities wrapper containing services, extensions,
  intervention types, supported currencies, and supported locales.
- **DiscoveryProtocol**: Protocol identification with name (`acp`), current version,
  supported version history (chronologically ordered), and documentation URL.
- **DiscoveryExtension**: Lightweight extension declaration with name and optional spec URL.

### Design Notes

- No authentication required -- the document is publicly accessible.
- Seller-scoped -- returns information that is stable across sessions.
- Merchant-specific and session-specific capabilities (payment methods, payment handlers)
  remain in the inline `capabilities` object on `POST /checkout_sessions`.
- Responses SHOULD include `Cache-Control: public, max-age=3600` as a recommended minimum.
- `transports` field advertises available transport bindings (`rest`, `mcp`), cross-referencing
  the MCP Transport Binding (SEP #135).
- `services`, `intervention_types`, and `transports` enums are closed per API version.

**Files changed:**

- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `rfcs/rfc.discovery.md`
- `examples/unreleased/examples.agentic_checkout.json`
- `docs/mcp-binding.md`

---

### Enhanced Schema Validation for Documentation Completeness

**Validation Script – Added** – Comprehensive validation rules to ensure all schemas in `spec/unreleased/` have complete descriptions and examples.

### New Validations

#### JSON Schema Validation

- **Field Descriptions**: All data models and fields must have descriptions. Validates recursively through properties, array items, `oneOf`/`anyOf`/`allOf`, and `additionalProperties`.
- **Model Examples**: Every data model in `$defs` must have at least one example (using `example` or `examples` field).

#### OpenAPI Validation

- **Field Descriptions**: All schema fields must have descriptions. Enforced as errors to ensure API documentation completeness.
- **Schema Examples**: All top-level schemas in `components/schemas` must have examples.

#### Dynamic File Discovery

- Removed hardcoded file lists (`SPECS` array)
- Added dynamic discovery: `getJsonSchemaFiles()` and `getOpenApiFiles()` functions
- Now validates ALL `schema.*.json` and `openapi.*.yaml` files in each version directory
- Automatically includes newly added schemas like `schema.discount.json` and `schema.extension.json`

### Fixed Validation Issues

#### Bug Fixes

- **Amount field validation**: Fixed false positives for properties using composition patterns (`allOf`, `$ref`, etc.). The validator now skips these when checking if amount fields are integers.

#### Schema Updates

Added missing descriptions and examples to `spec/unreleased/`:

- `schema.agentic_checkout.json`
- `schema.delegate_payment.json`
- `schema.discount.json`
- `schema.extension.json`
- `openapi.agentic_checkout.yaml`
- `openapi.delegate_payment.yaml`

### Benefits

- Prevents incomplete documentation from being committed
- Ensures consistency between JSON Schema and OpenAPI specifications
- Helps developers understand data models with comprehensive examples
- Runs automatically on every commit via GitHub Actions

**Files changed**: `scripts/validate-consistency.js`, `scripts/README.md`, `spec/unreleased/json-schema/*.json`, `spec/unreleased/openapi/*.yaml`

---

### Fix incorrect fulfillment values in complete and cancel response examples

The complete and cancel response examples incorrectly showed Standard shipping values (`fulfillment_option_123`, cost 100, total 430) after the update example switched to Express shipping (`fulfillment_option_456`, cost 500, total 830). Fixed to be consistent with the preceding update response.

#### Changes
- Fixed `selected_fulfillment_options`, fulfillment amount, and total in complete response example (RFC section 9.6)
- Fixed fulfillment amount and total in cancel response example (RFC section 9.8)
- Applied same fixes to `examples/unreleased/examples.agentic_checkout.json`

#### Files Updated
- `rfcs/rfc.agentic_checkout.md`
- `examples/unreleased/examples.agentic_checkout.json`

#### Reference
- Issue: #16

---

### Fix schema consistency between JSON Schema and OpenAPI

**Fixed** — two spec drift issues between JSON Schema and OpenAPI.

#### DiscountsResponse missing `rejected` array in JSON Schema

The OpenAPI spec and the discount extension schema (`schema.discount.json`) both define a `rejected` array on `DiscountsResponse` with `RejectedDiscount` items. The main JSON schema (`schema.agentic_checkout.json`) was missing it — only had `codes` and `applied`.

Added `rejected` array, `RejectedDiscount` type, and `DiscountErrorCode` enum to the main JSON schema to match the OpenAPI spec.

#### `frictionless` flow_preference missing properties in OpenAPI

The JSON schema defines `frictionless.properties.type` with enum `["low_risk"]` on `AuthenticationMetadata.flow_preference`. The OpenAPI spec had `frictionless` as an empty object with `additionalProperties: false` and no properties.

Added the `type` property with `low_risk` enum to the OpenAPI `frictionless` object to match the JSON schema.

#### Files changed

- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`

---

### Mandatory Idempotency Requirements and Guarantees

Agents retrying failed or timed-out requests had no protocol-level guarantee of safe replay. This change makes the `Idempotency-Key` header mandatory on all POST requests and defines explicit error responses for missing keys, in-flight collisions, and payload mismatches.

#### Changes

- **IdempotencyKey parameter**: Changed from `required: false` to `required: true` on both Agentic Checkout and Delegate Payment APIs. Added `maxLength: 255` constraint. UUID v4 recommended.

- **IdempotencyKey scoping**: Moved `IdempotencyKey` out of path-level parameters on `/checkout_sessions/{id}` so GET does not inherit the now-required header.

- **Idempotent-Replayed response header**: Added to all POST 2xx responses. Set to `"true"` when the response is a cached replay.

- **400 — idempotency_key_required**: Returned when `Idempotency-Key` header is missing from a POST request.

- **409 — idempotency_in_flight**: Returned when a request with the same key is still being processed. Includes `Retry-After` header.

- **422 — idempotency_conflict**: Returned when an `Idempotency-Key` is reused with a different request body.

- **Error.type enum**: Removed `request_not_idempotent` from the Agentic Checkout Error schema. All idempotency errors now use `type: invalid_request` with specific codes.

- **Error.code enum** (Delegate Payment): Added `idempotency_key_required` and `idempotency_in_flight`.

- **Examples**: Added idempotency error examples to both Agentic Checkout and Delegate Payment example files.

#### Related

- Closes issue #120

---

### IIN field max length 6 → 8

**Delegate Payment API – Changed**

- **IIN field length**: Updated `iin` field `maxLength` from 6 to 8 characters in `PaymentMethodCard` schema to support extended IIN ranges (ISO/IEC 7812-1).
  - `spec/unreleased/openapi/openapi.delegate_payment.yaml`
  - `spec/unreleased/json-schema/schema.delegate_payment.json`
  - `rfcs/rfc.delegate_payment.md`

---

### Markdown Specification (CommonMark)

**Changed** -- formalized markdown semantics for `content_type: "markdown"` fields.

When `content_type` is set to `"markdown"`, content MUST conform to
[CommonMark version 0.31.2](https://spec.commonmark.org/0.31.2/). Raw HTML
elements MUST NOT be included. Agents MUST render using a CommonMark-compliant
parser with raw HTML output disabled or sanitized.

Affected types: Disclosure, MessageInfo, MessageWarning, MessageError.

**Files changed:** `spec/unreleased/json-schema/schema.agentic_checkout.json`, `spec/unreleased/openapi/openapi.agentic_checkout.yaml`, `rfcs/rfc.agentic_checkout.md`

---

### Marketing Consent Support

Add marketing consent support to enable sellers to offer opt-in marketing subscriptions during checkout.

### New Schemas

- **MarketingConsentOption**: Seller-declared consent option with `channel` (open enum, e.g. email, sms, whatsapp),
  `display_text`, `privacy_policy_url`, and optional `is_subscribed` boolean for returning buyers.
- **MarketingConsent**: Agent-submitted consent decision with `channel` and `opted_in` boolean.

### CheckoutSession Changes

- **`marketing_consent_options`** added as an optional array on `CheckoutSessionBase`. Sellers
  include this to signal available marketing channels and the buyer's existing subscription status.
  An empty array is equivalent to absent.
- **`marketing_consents`** added as an optional array on `CheckoutSessionCompleteRequest`. Agents
  include the buyer's consent decisions for each option surfaced. Sellers ignore entries for
  channels not offered.

### Marketing Channel Resolution

- For email consent: seller uses `buyer.email` (primary) or `fulfillment_details.email` (fallback).
- For SMS/WhatsApp consent: seller uses `buyer.phone_number` (primary) or
  `fulfillment_details.phone_number` (fallback).

### Design Notes

- Consent is captured at complete checkout time only — not during checkout updates.
- `is_subscribed` lets sellers communicate existing subscription status so agents render the
  correct default (pre-checked for returning subscribers, unchecked for new buyers).
- Agents MAY selectively surface a subset of options; unsurfaced options are omitted from the
  response, preserving existing subscription state.
- Omission of `marketing_consents` in the complete request preserves all existing subscriptions.
- Sellers who do not want to risk accidental revocation should omit the channel from
  `marketing_consent_options`.

**Files changed:**

- `spec/unreleased/json-schema/schema.agentic_checkout.json` (new schemas and fields)
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml` (new schemas and fields)
- `examples/unreleased/examples.agentic_checkout.json` (consent examples)
- `rfcs/rfc.marketing_consent.md` (RFC document)

---

### MCP Transport Binding

**Added** -- Model Context Protocol (MCP) transport binding for ACP checkout operations.

### New Files

- **OpenRPC Schema**: `spec/unreleased/openrpc/openrpc.agentic_checkout.json` -- defines 5 MCP tools
- **Binding Specification**: `docs/mcp-binding.md` -- REST-to-MCP mapping conventions
- **MCP Examples**: `examples/unreleased/examples.mcp.agentic_checkout.json`

### MCP Tools

- `create_checkout_session` -- maps to POST /checkout_sessions
- `get_checkout_session` -- maps to GET /checkout_sessions/{id}
- `update_checkout_session` -- maps to POST /checkout_sessions/{id}
- `complete_checkout_session` -- maps to POST /checkout_sessions/{id}/complete
- `cancel_checkout_session` -- maps to POST /checkout_sessions/{id}/cancel

### Design Decisions

- Argument structure: `meta` (headers) / `id` (path param) / `payload` (request body)
- `payload` $refs existing ACP request schemas directly -- no schema duplication
- Auth handled via MCP server configuration, not per-request
- Errors use uniform -32000 with ACP Error object in JSON-RPC error.data

**Files changed:** spec/unreleased/openrpc/openrpc.agentic_checkout.json,
docs/mcp-binding.md, examples/unreleased/examples.mcp.agentic_checkout.json

---

### Message Resolution Field

**Added** – optional `resolution` on `MessageInfo`, `MessageWarning`, and `MessageError`.

Indicates who is responsible for resolving the message:

- `recoverable`: Agent can fix via API (e.g., retry with different parameters)
- `requires_buyer_input`: Buyer must provide information the API cannot collect programmatically (checkout incomplete)
- `requires_buyer_review`: Buyer must authorize before order placement due to policy, regulatory, or entitlement rules (checkout complete)

Enables agents to decide whether to attempt automated recovery or escalate to the buyer.

**Files changed:** `spec/unreleased/openapi/openapi.agentic_checkout.yaml`, `spec/unreleased/json-schema/schema.agentic_checkout.json`, `rfcs/rfc.agentic_checkout.md`, `examples/discount-extension/rejected-discount-code.json`

---

### Native Orders Support

**Added** – rich post-purchase order tracking with line items, fulfillments, and adjustments.

### New Schemas

- **OrderLineItem**: Per-item tracking with `quantity.ordered` and `quantity.shipped`
- **Fulfillment**: Tracks shipping, pickup, and digital delivery with carrier info and tracking
- **FulfillmentEvent**: Append-only log of delivery events (shipped, in transit, delivered, etc.)
- **Adjustment**: Post-order changes (refunds, credits, returns, disputes, chargebacks)
- **Order Totals**: Reuses checkout `Total` schema for order-level financial summary
- **LineItemReference**: References line items in fulfillments and adjustments

### Enhanced Order Schema

The existing `Order` schema gains optional fields:

- `type` – Discriminator field for webhook payloads (always `"order"`)
- `line_items[]` – What was ordered with fulfillment progress
- `fulfillments[]` – How items are being delivered
- `adjustments[]` – Post-order changes
- `totals` – Financial summary

All new fields are optional, maintaining backward compatibility.

### Order Status Enum

Extended to a superset that aligns with the webhook spec:
`[created, confirmed, manual_review, processing, shipped, delivered, canceled]`

### Order Totals

- Replaced flat `OrderTotals` object with `Total[]` array, reusing the same `Total` schema from checkout sessions
- Added `amount_refunded` to `Total.type` enum for post-purchase refund tracking
- The `total` entry is documented as the original charged amount at checkout (pre-adjustment)

### Digital Fulfillment

- Added `digital_delivery` sub-object to Fulfillment with `access_url`, `license_key`, `expires_at`
- Added `ready_for_pickup` to Fulfillment and FulfillmentEvent status/type enums
- Documented per-type status applicability (which statuses apply to shipping, pickup, digital)

### Adjustment Amount

- `Adjustment.amount` is now documented as the total amount credited to the buyer, inclusive of tax

### Webhook Spec Alignment

- `EventDataOrder` now composes the full `Order` schema via cross-file `$ref`
- `refunds[]` and the `Refund` schema have been removed from `EventDataOrder` in favor of `adjustments[]`
- Fixed pre-existing bug: inline example had `amount: "1.00"` (string) instead of integer
- Updated inline examples to show rich Order fields (line_items, fulfillments, adjustments, totals)

### Agent Use Cases

- "Where's my order?" → `fulfillments[]` with tracking and events
- "What did I order?" → `line_items[]` with details
- "Which items shipped?" → `line_items[].quantity.shipped`
- "Did I get a refund?" → `adjustments[]` with status
- "How much was I refunded?" → `totals[]` entry with `type: "amount_refunded"`

**Files changed:** `spec/unreleased/openapi/openapi.agentic_checkout.yaml`, `spec/unreleased/openapi/openapi.agentic_checkout_webhook.yaml`, `spec/unreleased/json-schema/schema.agentic_checkout.json`, `rfcs/rfc.orders.md`, `examples/orders/`

---

### Payment handler display order

**Added** – Optional `display_order` on each payment handler in `capabilities.payment.handlers`.

Sellers can suggest a preferred display order for payment methods (lower value = higher preference). The ordering is **suggestive**: platforms and agents MAY reorder (e.g. for user preference or localization). This lets sellers express their fraud vs. conversion preferences so agents have a standard hint when presenting payment options.

**Backward compatible:** Optional field; existing implementations ignore unknown properties. No breaking changes.

**RFC:** `rfcs/rfc.payment_handlers.md`
**Schema:** `spec/unreleased/json-schema/schema.agentic_checkout.json`, `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
**Examples:** `examples/unreleased/examples.agentic_checkout.json`

---

### PaymentHandler display_name

**Added** – optional field for payment UI. Backward compatible.

#### Schema changes

- **PaymentHandler.display_name** — Optional human-readable name for the payment method (e.g. "Credit Card", "PayPal"). Used when showing payment options to the buyer; avoids displaying the handler’s technical `name` (e.g. `dev.acp.tokenized.card`).

#### Files changed

- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml` — added `display_name` on PaymentHandler
- `examples/unreleased/examples.agentic_checkout.json` — added `display_name` on handler examples

---

### Agentic Checkout schema improvements (platform alignment)

**Added / Changed** – schema updates to align with common patterns. All new fields are optional; backward compatible.

#### Fixes

- **Duplicate key:** Removed duplicate `fulfillment_groups` property in `CheckoutSessionBase` (invalid JSON; only one occurrence retained).

#### Schema changes

- **Address:** Added description on `country` recommending ISO 3166-1 alpha-2 (e.g. `US`, `GB`) for interoperability. Added optional `company` for B2B and shipping address.
- **FulfillmentDetails.phone_number:** Added description recommending E.164 format for global and carrier interoperability.
- **Order notes:** Added optional `order_notes` (string, maxLength 5000) to `CheckoutSessionCreateRequest`, `CheckoutSessionUpdateRequest`, and `CheckoutSessionCompleteRequest` for delivery instructions, gift messages, and customer comments.
- **OrderConfirmation:** Added optional `order_notes` to echo order notes on confirmation.
- **Order:** Added description on `order_number` (human-readable display number). Added optional `client_reference_id`: reference provided by the client (agent/platform) when completing checkout; the merchant stores it on the order and returns it so the platform can reconcile its transaction (e.g. `platform_txn_abc789`) with the merchant order (e.g. `ord_xyz`) for support, refunds, or analytics. Aligns with Stripe’s `client_reference_id` (the client provides the value, the merchant stores it).

#### Descriptions added (developer clarity)

Schema descriptions were added so developers can clearly tell the Order identifiers apart:

- **Order.id** — “Merchant’s unique order id (assigned when the order is created). Use for API calls, permalink, and webhooks.” Distinguishes the merchant’s canonical order id from the session id and from any client reference.
- **Order.checkout_session_id** — “Id of the checkout session that created this order. Links the order back to the agentic checkout flow.” Makes the order–session relationship explicit.
- **Order.client_reference_id** — Short description in the schema (“Reference from the client (agent/platform) stored on the order for reconciliation…”); fuller explanation and marketplace example are in this changelog so the schema stays concise.

#### Files changed

- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `examples/unreleased/examples.agentic_checkout.json` — added `company`, `order_notes`, `order_number`, `client_reference_id`, and `confirmation.order_notes` to relevant examples

---

### Seller-backed payment

**Added** – `dev.acp.seller_backed` payment handler pattern and four handler types: `saved_card`, `gift_card`, `points`, `store_credit`.

Sellers can declare payment options in `capabilities.payment.handlers` that are resolved on the seller's backend without credential transfer. All use `requires_delegate_payment: true` and `requires_pci_compliance: false`. Tokenization via `delegate_payment` preserves audit trail and observability.

**Backward compatible:** Additive only; no schema or API changes. Existing implementations ignore unknown handlers.

**RFC:** `rfcs/rfc.seller_backed_payment_handler.md`
**Examples:** `examples/2026-01-30/examples.agentic_checkout.json`, `examples/unreleased/examples.agentic_checkout.json`

---

### Webhook signing: Stripe-aligned format and replay protection

Specifies the Merchant-Signature header format for agentic checkout webhooks and adds replay protection. Aligns with Stripe’s webhook signature scheme for interoperability.

#### Changes

- **Signature format:** Header value is `t=<unix_seconds>,v1=<64_hex>`. Signed payload is `timestamp + "." + raw_body`; HMAC-SHA256 with shared secret. Pattern accepts hex (`[a-fA-F0-9]{64}`).
- **Replay protection:** Receiver rejects requests when timestamp `t` is outside an allowed window. Recommended tolerance 300 seconds. Description states that signing is used to prevent replay attacks and to verify authenticity and integrity.

#### Breaking Changes

None. This defines the format of an already-required header (signing was already mandatory).

#### Files Updated

- `spec/unreleased/openapi/openapi.agentic_checkout_webhook.yaml`

---

## Files Released

**Specifications:**
- `spec/2026-04-17/json-schema/schema.agentic_checkout.json`
- `spec/2026-04-17/json-schema/schema.cart.json`
- `spec/2026-04-17/json-schema/schema.delegate_authentication.json`
- `spec/2026-04-17/json-schema/schema.delegate_payment.json`
- `spec/2026-04-17/json-schema/schema.discount.json`
- `spec/2026-04-17/json-schema/schema.extension.json`
- `spec/2026-04-17/json-schema/schema.feed.json`
- `spec/2026-04-17/openapi/openapi.agentic_checkout.yaml`
- `spec/2026-04-17/openapi/openapi.agentic_checkout_webhook.yaml`
- `spec/2026-04-17/openapi/openapi.cart.yaml`
- `spec/2026-04-17/openapi/openapi.delegate_authentication.yaml`
- `spec/2026-04-17/openapi/openapi.delegate_payment.yaml`
- `spec/2026-04-17/openapi/openapi.feed.yaml`
- `spec/2026-04-17/openrpc/openrpc.agentic_checkout.json`

**Examples:**
- `examples/2026-04-17/discount-extension/README.md`
- `examples/2026-04-17/discount-extension/automatic-discount.json`
- `examples/2026-04-17/discount-extension/order-level-discount.json`
- `examples/2026-04-17/discount-extension/percentage-discount-with-allocations.json`
- `examples/2026-04-17/discount-extension/rejected-discount-code.json`
- `examples/2026-04-17/discount-extension/stacked-discounts.json`
- `examples/2026-04-17/examples.agentic_checkout.json`
- `examples/2026-04-17/examples.delegate_authentication.json`
- `examples/2026-04-17/examples.delegate_payment.json`
- `examples/2026-04-17/examples.feed.json`
- `examples/2026-04-17/examples.mcp.agentic_checkout.json`
- `examples/2026-04-17/examples.multi_item_checkout.json`
- `examples/2026-04-17/orders/digital-fulfillment.json`
- `examples/2026-04-17/orders/partial-fulfillment.json`
- `examples/2026-04-17/orders/refunded-order.json`
- `examples/2026-04-17/orders/shipped-order.json`
- `examples/2026-04-17/orders/simple-order.json`
