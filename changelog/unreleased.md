# Unreleased Changes

## Version 2026-01-22 - Enhanced Checkout Capabilities

This release introduces significant enhancements to the Agentic Checkout Specification. These changes enable broader commerce scenarios while maintaining backward compatibility where possible.

### Capability Negotiation

Added support for **Capability Negotiation** to enable Agents and Sellers to discover and negotiate supported features during checkout.

**Schema Changes:**
- Added `Capabilities` object to requests and responses
- Added `InterventionCapabilities` schema
- Added `PaymentMethodObject` schema for payment method constraints
- `capabilities` field is **REQUIRED** in `CheckoutSessionCreateRequest`
- `capabilities` field is **REQUIRED** in all `CheckoutSession` responses

**Key Features:**
- **Single namespace**: Same `capabilities` object structure used in both requests and responses
- **Intersection semantics**: Seller computes and returns intersection of supported interventions
- **Context determines party**: Request context = Agent capabilities, Response context = Seller capabilities
- **Early incompatibility detection**: Detect capability mismatches before payment authorization

**Capabilities Supported:**

*Payment Methods (Seller only, in responses):*
- Simple strings: `card`, `card.network_token`, `wallet.apple_pay`, `bnpl.klarna`
- Objects with constraints for cards: brands (visa, mastercard, etc.), funding_types (credit, debit, prepaid)

*Interventions (both parties):*
- `supported`: List of interventions (`3ds`, `biometric`, `address_verification`)
  - Agent request: What interventions the agent can handle
  - Seller response: Intersection of mutually supported interventions
- Agent fields: `display_context`, `redirect_context`, `max_redirects`, `max_interaction_depth`
- Seller fields: `required`, `enforcement`

**Endpoints Updated:**
- All checkout endpoints now include `capabilities` in requests/responses

See [RFC: Capability Negotiation](../rfcs/rfc.capability_negotiation.md) for full specification details.

---

### Breaking Changes

#### 1. Renamed `items` to `line_items` in Create/Update Requests

**Impact:** `CheckoutSessionCreateRequest` and `CheckoutSessionUpdateRequest`

**Change:**
- Old: `items` array
- New: `line_items` array

**Migration:**
```json
// OLD
{
  "items": [{ "id": "item_123", "quantity": 1 }]
}

// NEW
{
  "line_items": [
    {
      "item": { "id": "item_123" },
      "quantity": 1
    }
  ]
}
```

**Rationale:** Aligns request/response terminology and clarifies that items are line-level entries in the cart.

#### 2. Added Required `currency` Field to Create Request

**Impact:** `CheckoutSessionCreateRequest`

**Change:**
- `currency` field is now **required** in create requests

**Migration:**
```json
// OLD
{
  "items": [...]
}

// NEW
{
  "currency": "usd",
  "line_items": [...]
}
```

**Rationale:** Explicit currency declaration is essential for multi-currency support and removes ambiguity.

#### 3. Moved `quantity` from Item to LineItem

**Impact:** `Item` and `LineItem` schemas

**Change:**
- Old: `Item` schema contained `quantity` field
- New: `LineItem` schema contains `quantity` field; `Item` is now just a reference

**Migration:**
```json
// OLD Response
{
  "line_items": [{
    "item": { "id": "item_123", "quantity": 2 }
  }]
}

// NEW Response
{
  "line_items": [{
    "item": { "id": "item_123" },
    "quantity": 2
  }]
}
```

**Rationale:** Enables hierarchical product relationships and cleaner separation between item definitions and cart line entries.

#### 4. Changed Buyer Name Fields

**Impact:** `Buyer` schema

**Change:**
- `first_name` and `last_name` are now **optional**
- Added optional `full_name` field as an alternative
- `email` is now **required**

**Migration:**
```json
// OLD (first_name required)
{
  "buyer": {
    "first_name": "John",
    "last_name": "Doe"
  }
}

// NEW (flexible name handling)
{
  "buyer": {
    "email": "john@example.com",      // Required
    "full_name": "John Doe"            // OR first_name + last_name
  }
}
```

**Rationale:** Supports international naming conventions and reduces required fields.

### New Features

#### 1. Protocol Versioning & Capability Discovery

Added `protocol` object to all checkout session responses:

```json
{
  "protocol": {
    "version": "2026-01-22",
    "capabilities": []
  }
}
```

#### 2. Enhanced Messaging System

- Added **warning** message type with severity levels
- Expanded error codes
- Added `severity` field: `info`, `low`, `medium`, `high`, `critical`

#### 3. New Fulfillment Types

Added support for:
- **Pickup** (`FulfillmentOptionPickup`): In-store, curbside, locker pickup
- **Local Delivery** (`FulfillmentOptionLocalDelivery`): Same-day, scheduled delivery

#### 4. Risk Signals for Fraud Prevention

Added `risk_signals` to `CheckoutSessionCompleteRequest` for IP address, user agent, device fingerprint, etc.

#### 5. Hierarchical Product Structure

Added `parent_id` to `LineItem` for bundled/related products.

#### 6. Multi-Currency Support

Added presentment currency for display purposes with `presentment_currency`, `exchange_rate`, and `exchange_rate_timestamp` fields.

#### 7. Session Management Enhancements

- Added `expires_at` for session expiration
- Added `continue_url` for recovery
- Added `created_at` and `updated_at` timestamps
- New status values: `incomplete`, `requires_escalation`, `complete_in_progress`

#### 8. Additional Features

- B2B commerce features (purchase orders)
- Promotional campaigns (available promotions)
- Enhanced product metadata (SKU, variant ID, weight, dimensions)
- Expanded link types (`shipping_policy`, `contact_us`, `about_us`, `faq`, `support`)
- Order confirmation details in complete responses
- Payment response object with provider and instruments

### Schema Changes

**New Schemas Added:**
- `ProtocolVersion`
- `PaymentResponse`
- `RiskSignals`
- `FulfillmentOptionPickup`
- `FulfillmentOptionLocalDelivery`
- `MessageWarning`

**Modified Schemas:**
- `CheckoutSessionBase` - Added many new optional fields
- `LineItem` - Added `quantity`, `parent_id`, extensive metadata; now uses `totals` array for pricing breakdown instead of individual amount fields
- `Item` - Removed `quantity`; added `name` and `unit_amount`
- `Buyer` - Flexible name handling, company details
- `Message` - Added severity levels
- `Link` - Added title and new types
- `FulfillmentOption*` - All fulfillment option types now use `totals` array instead of individual `subtotal`, `tax`, `total` fields
- `SelectedFulfillmentOption` - Simplified from discriminated union; now includes `type`, `option_id`, and `item_ids` directly

### Migration Guide

1. Update request construction to use `line_items` instead of `items`
2. Include `currency` in all create requests
3. Move `quantity` from Item to LineItem level in response handling
4. Update Buyer handling for flexible name fields
5. Optionally adopt new features (protocol versioning, new fulfillment types, etc.)

---

## Version 2026-01-16

### Capability Negotiation

Added support for capability negotiation, enabling agents and merchants to dynamically discover and agree on supported protocol features.

See [RFC: Capability Negotiation](../rfcs/rfc.capability_negotiation.md) for full specification details.

### Supported Card Networks

Added `supported_card_networks` field to advertise which card networks a merchant accepts.

---

## Version 2025-12-11

### 1. Fix Fulfillment Amount Types in OpenAPI Specification

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

### 2. Total Description Field

- Added optional `description` field to the `Total` type to provide additional context for line items, especially fees
- The `description` field is optional and can be used to explain charges (e.g., "Processing and handling fee")

### 3. Link Type: return_policy

- Added `return_policy` as a new link type option alongside `terms_of_use` and `privacy_policy`
- Removed `seller_shop_policies` link type (redundant; item/seller-specific policies should be attached to line items in marketplace scenarios)
- Updated specification files:
  - `spec/json-schema/schema.agentic_checkout.json`
  - `spec/openapi/openapi.agentic_checkout.yaml`
  - `rfcs/rfc.agentic_checkout.md`
  - `examples/examples.agentic_checkout.json`

## Version 2025-12-12

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
- New: Array `selected_fulfillment_options[]` with simplified structure supporting multiple selections and item-level mappings

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
      "option_id": "fulfillment_option_123",
      "item_ids": ["item_456"]
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

### 6. Added Affiliate Attribution Extension

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

## Version 2026-01-15

### Modified shape of `supported_payment_methods`

**Modified shape of `supported_payment_methods` within `payment_provider` to allow merchants to specify supported cart networks.**

**Impact:** schema of `supported_payment_methods` field, and introduction of `PaymentMethod` object.

**Change:**
- Old: `supported_payment_methods` was an error of enums which specified the supported payment types.
- New: `supported_payment_methods` is an array of `PaymentMethod`, which allows specification of supported card networks.

**Migration:**
```json
// OLD
{
  "provider": "stripe",
  "supported_payment_methods": ["card"]
}

// NEW
{
  "provider": "stripe",
  "supported_payment_methods": [
    {
      "type": "card",
      "supported_card_networks": ["amex", "discover", "mastercard", "visa"]
    }
  ]
}
```

**Rationale:** Merchants will want to specify the card network they are willing to accept for certain types of transactions.

---

## Version Compatibility

- Clients MUST send `API-Version: 2026-01-22` header
- Previous version `2026-01-16` is deprecated
- All changes are breaking and require client updates

## Files Updated

- `spec/json-schema/schema.agentic_checkout.json`
- `spec/openapi/openapi.agentic_checkout.yaml`
- `examples/examples.agentic_checkout.json`
- `rfcs/rfc.agentic_checkout.md`
