# Unreleased

## Added

### Capability Negotiation Extension

Added support for **Capability Negotiation** to enable bidirectional capability exchange between Agents and Sellers during checkout session creation and management.

**Schema Changes:**
- Added `SellerCapabilities` object with nested `SellerInterventionCapabilities` and `SellerFeatureCapabilities`
- Added `AgentCapabilities` object with nested `AgentInterventionCapabilities` and `AgentFeatureCapabilities`
- Extended `CheckoutSessionBase` response to include **REQUIRED** `seller_capabilities` field
- Extended `CheckoutSessionCreateRequest` to accept **REQUIRED** `agent_capabilities` field
- **REMOVED** `PaymentProvider.supported_payment_methods` field (redundant with `seller_capabilities.payment_methods`)

**Key Features:**
- **Required fields**: Both `agent_capabilities` and `seller_capabilities` are REQUIRED when implementing this extension, ensuring predictable behavior and eliminating ambiguity
- **Seller capability advertisement:** Sellers declare supported payment methods (with optional card brand constraints), intervention requirements (including authentication methods), and features in checkout session responses
- **Agent capability declaration:** Agents declare their interaction capabilities (authentication and intervention handling combined) in checkout session requests to help Sellers optimize the experience
- **Early incompatibility detection:** Both parties can detect capability mismatches before payment authorization
- **Hierarchical payment method matching:** Supports hierarchical identifiers (e.g., `card`, `card.network_token`, `wallet.apple_pay`) with optional card brand/funding type constraints
- **Extensibility:** Forward-compatible design allows new capabilities to be added without breaking changes

**Capabilities Supported:**

*Payment Methods (Seller only):*
- Hierarchical identifiers: `card`, `card.network_token`, `card.digital_wallet`, `bnpl.{provider}`, `wallet.{provider}`, `bank_transfer.{type}`
- Object format with constraints for card methods:
  - `brands`: Specific card networks (visa, mastercard, amex, discover, diners, jcb, unionpay, eftpos, interac)
  - `funding_types`: Credit, debit, or prepaid cards

*Interventions (includes authentication methods):*
- Authentication methods: `3ds`, `3ds2`, `biometric`, `3ri`, `otp`, `email_verification`, `sms_verification`
- Interaction types: `3ds_redirect`, `3ds_challenge`, `3ds_frictionless`, `address_verification`, `payment_method_update`, `otp_verification`, `email_verification`
- Enforcement modes (Seller): `always`, `conditional`, `optional`
- Agent redirect handling: `in_app`, `external_browser`, `none`
- Agent display contexts: `native`, `webview`, `modal`, `redirect`
- Interaction depth limits for complex flows

*Features:*
- Seller features: `partial_auth`, `saved_payment_methods`, `network_tokenization`, `incremental_auth`, `async_completion`
- Agent features: `async_completion`, `session_persistence`, `multi_session`

**Endpoints Updated:**
- `POST /checkout_sessions` — Create Session (includes `agent_capabilities` in request, returns `seller_capabilities` in response)
- `POST /checkout_sessions/{id}` — Update Session (returns `seller_capabilities` in response)
- `GET /checkout_sessions/{id}` — Retrieve Session (returns `seller_capabilities` in response)
- `POST /checkout_sessions/{id}/complete` — Complete Session (returns `seller_capabilities` in response)

**Error Handling:**
- New error code: `payment_method_unsupported` for incompatible payment methods
- New error code: `intervention_required` for intervention/authentication requirement mismatches
- Implementations MUST gracefully ignore unknown capability values for forward compatibility

**Adoption Model:**
- Extension is opt-in: Implementations MAY choose to implement capability negotiation
- Implementation is all-in: If implemented, both `agent_capabilities` and `seller_capabilities` MUST be present
- No partial implementations: Ensures predictable behavior and eliminates ambiguity
- Existing implementations without this extension continue to work unchanged
- `seller_capabilities.payment_methods` is now the single source of truth for payment method support

See [RFC: Capability Negotiation](../rfcs/rfc.capability_negotiation.md) for full specification details.

---

### Affiliate Attribution Extension

Added support for the **Affiliate Attribution** extension, enabling agents to credit third-party publishers (affiliates) without relying on cookies, redirects, or client-side tracking.

**Schema Changes:**
- Added `AffiliateAttribution` object to JSON Schema and OpenAPI specifications
- Added `AffiliateAttributionSource` for attribution source context
- Added `AffiliateAttributionMetadata` for flat key/value additional context
- Added `touchpoint` field (`first` | `last`) to support multi-touch attribution models
- Extended `CheckoutSessionCreateRequest` to accept optional `affiliate_attribution` (first-touch)
- Extended `CheckoutSessionCompleteRequest` to accept optional `affiliate_attribution` (last-touch)

**Key Features:**
- **Multi-touch support:** Capture attribution at both session creation (first-touch) and completion (last-touch); networks determine weighting
- **Write-only:** Attribution data is accepted but never returned in responses (GET, list, webhooks)
- **Write-once with idempotency:** First valid attribution claim wins; conflicting claims with different/missing `Idempotency-Key` are silently ignored, but reusing the same `Idempotency-Key` with a different payload returns **409 Conflict**
- **Fraud-resistant:** Supports opaque provider-issued tokens for out-of-band validation
- **Privacy-preserving:** No user PII permitted; fields must not contain emails, phone numbers, or stable user identifiers
- **Forward-compatible:** Schema allows unknown fields to support future extensions (per RFC §8.2)

**Endpoints Updated:**
- `POST /checkout_sessions` — Create Session (first-touch attribution)
- `POST /checkout_sessions/{id}/complete` — Complete Session (last-touch attribution)

See [RFC: Affiliate Attribution](../rfcs/rfc.affiliate_attribution.md) for full specification details.

---

# Unreleased Changes

## Version 2025-12-11

### Bug Fixes

#### Fix Fulfillment Amount Types in OpenAPI Specification

**Fixed inconsistency in OpenAPI spec where fulfillment option amounts were incorrectly typed as strings instead of integers.**

**Version Note:** Per CONTRIBUTING.md guidelines, the specification version has been incremented from `2025-09-29` to `2025-12-11` to reflect this schema change. While this is technically a bug fix/clarification (not a breaking change), we increment the version conservatively for any OpenAPI schema modifications to ensure proper tracking and avoid confusion.

In the OpenAPI specification (`spec/openapi/openapi.agentic_checkout.yaml`), the `subtotal`, `tax`, and `total` fields in both `FulfillmentOptionShipping` and `FulfillmentOptionDigital` schemas were defined as `type: string`. This was inconsistent with:

- The JSON Schema (`spec/json-schema/schema.agentic_checkout.json`) which defines them as `type: integer`
- The RFC documentation which explicitly states: "Amounts **MUST** be integers in minor units"
- The example files which show these values as numeric (unquoted) integers
- The `Total` schema which correctly defines the `amount` field as `type: integer`

**Changes:**
- Changed `subtotal`, `tax`, and `total` from `type: string` to `type: integer` in `FulfillmentOptionShipping`
- Changed `subtotal`, `tax`, and `total` from `type: string` to `type: integer` in `FulfillmentOptionDigital`

**Impact:**
This is a **clarification/bug fix**, not a breaking change. The specification has always required integer amounts in minor units (per the RFC), and all examples demonstrate integer usage. Implementations following the RFC and examples should already be using integers, so this change aligns the OpenAPI schema with the actual specification behavior.

If any implementation was incorrectly sending/receiving these values as quoted strings (e.g., `"100"` instead of `100`), they should update to use numeric integers to comply with the specification.

## Total Description Field

- Added optional `description` field to the `Total` type to provide additional context for line items, especially fees
- The `description` field is optional and can be used to explain charges (e.g., "Processing and handling fee")

## Link Type: return_policy

- Added `return_policy` as a new link type option alongside `terms_of_use` and `privacy_policy`
- Removed `seller_shop_policies` link type (redundant; item/seller-specific policies should be attached to line items in marketplace scenarios)
- Updated specification files:
  - `spec/json-schema/schema.agentic_checkout.json`
  - `spec/openapi/openapi.agentic_checkout.yaml`
  - `rfcs/rfc.agentic_checkout.md`
  - `examples/examples.agentic_checkout.json`
## Version 2025-12-12 - Breaking Changes

This release introduces several breaking changes to the Agentic Commerce Protocol based on learnings from URBN and Etsy adapter implementations.

### 1. Renamed `fulfillment_address` to `fulfillment_details`

**Impact:** Both requests (Create/Update) and all responses

**Change:**
- Old structure: Flat `fulfillment_address` object with address fields only
- New structure: Nested `fulfillment_details` object with optional `name`, `phone_number`, `email`, and nested `address` object

**Migration:**
```json
// OLD
{
  "fulfillment_address": {
    "name": "John Doe",
    "line_one": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "country": "US",
    "postal_code": "94102"
  }
}

// NEW
{
  "fulfillment_details": {
    "name": "John Doe",
    "phone_number": "15551234567",
    "email": "john@example.com",
    "address": {
      "name": "John Doe",
      "line_one": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "country": "US",
      "postal_code": "94102"
    }
  }
}
```

### 2. Replaced `fulfillment_option_id` with `selected_fulfillment_options`

**Impact:** Update requests and all responses

**Change:**
- Old: Single string `fulfillment_option_id` field
- New: Array `selected_fulfillment_options[]` with type-specific nested structures supporting multiple selections and item-level mappings

**Migration:**
```json
// OLD
{
  "fulfillment_option_id": "fulfillment_option_123"
}

// NEW
{
  "selected_fulfillment_options": [
    {
      "type": "shipping",
      "shipping": {
        "option_id": "fulfillment_option_123",
        "item_ids": ["item_456"]
      }
    }
  ]
}
```

**Rationale:** Supports selecting different fulfillment options for different items in the same cart, essential for complex fulfillment scenarios.

### 3. Made `subtotal` and `tax` optional in FulfillmentOption

**Impact:** Both `FulfillmentOptionShipping` and `FulfillmentOptionDigital` schemas

**Change:**
- Old: `subtotal` and `tax` were required fields
- New: `subtotal` and `tax` are optional; only `total` is required

**Migration:**
```json
// OLD - both subtotal and tax required
{
  "type": "shipping",
  "id": "fulfillment_option_123",
  "title": "Standard Shipping",
  "subtotal": 100,
  "tax": 0,
  "total": 100
}

// NEW - can omit subtotal and tax if not available
{
  "type": "shipping",
  "id": "fulfillment_option_123",
  "title": "Standard Shipping",
  "total": 100
}
```

**Rationale:** Not all sellers provide tax/subtotal breakdown for fulfillment options. Only the total amount is essential.

### 4. Added `selected_fulfillment_options` to UpdateCheckout request

**Impact:** `CheckoutSessionUpdateRequest` schema

**Change:**
- Old: Could only update via `fulfillment_option_id` (now removed)
- New: Update via `selected_fulfillment_options[]` array

**Migration:** See migration example in #2 above.

### 5. Order details in complete response

**Impact:** `CheckoutSessionWithOrder` response schema

**Change:**
- The `order` object with `id`, `checkout_session_id`, and `permalink_url` is now explicitly documented and required in complete responses

**Migration:** No change needed - this was already in the spec but is now formally required.

---

## Version Compatibility

- Clients MUST send `API-Version: 2026-01-12` header
- Previous version `2025-09-29` is deprecated
- All changes are breaking and require client updates

## Files Updated

- `spec/json-schema/schema.agentic_checkout.json`
- `spec/openapi/openapi.agentic_checkout.yaml`
- `examples/examples.agentic_checkout.json`
- `rfcs/rfc.agentic_checkout.md`
