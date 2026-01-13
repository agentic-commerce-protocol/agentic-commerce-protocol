# Unreleased Changes

## Custom Attributes for Items

### New Feature: Flexible Item Metadata

**Added `custom_attributes` field to the `Item` model to support service payments and bespoke product customization.**

This enhancement enables AI agents to pass structured metadata when creating or updating checkout sessions, unlocking two major use cases:

1. **Service Payments**: Payment of non-product services such as parking tickets, utility bills, government fees, and permits
2. **Bespoke Product Customization**: Personalization of physical products like engraving, monograms, made-to-measure items, and custom configurations

**Schema Changes:**

The `Item` model now accepts an optional `custom_attributes` array:

```json
{
  "id": "item_123",
  "quantity": 1,
  "custom_attributes": [
    {
      "display_name": "Ticket Number",
      "value": "PKT-2026-001234"
    },
    {
      "display_name": "License Plate",
      "value": "ABC-123"
    }
  ]
}
```

**Impact:**
- **Backward Compatible**: The `custom_attributes` field is optional; existing implementations continue to work unchanged
- **Reuses Existing Schema**: Leverages the existing `CustomAttribute` type (`display_name`, `value`)
- **Request Models Affected**: `CheckoutSessionCreateRequest` and `CheckoutSessionUpdateRequest`

**Files Updated:**
- `spec/json-schema/schema.agentic_checkout.json` - Added `custom_attributes` to Item schema
- `spec/openapi/openapi.agentic_checkout.yaml` - Added `custom_attributes` to Item schema
- `rfcs/rfc.agentic_checkout.md` - Updated Item model documentation
- `examples/examples.agentic_checkout.json` - Added parking ticket and custom product examples
- `proposal.md` - Comprehensive proposal with use cases and product feed requirements

**Example Use Cases:**

*Parking Ticket Payment:*
```json
{
  "items": [{
    "id": "parking_ticket",
    "quantity": 1,
    "custom_attributes": [
      {"display_name": "Ticket Number", "value": "PKT-2026-001234"},
      {"display_name": "License Plate", "value": "ABC-123"},
      {"display_name": "Violation Date", "value": "2026-01-10"}
    ]
  }]
}
```

*Custom Engraved Product:*
```json
{
  "items": [{
    "id": "watch_silver_42mm",
    "quantity": 1,
    "custom_attributes": [
      {"display_name": "Engraving Text", "value": "To Sarah, Love Always - M"},
      {"display_name": "Engraving Position", "value": "case_back"},
      {"display_name": "Font Style", "value": "script"}
    ]
  }]
}
```

**Implementation Notes:**
- Merchants should validate custom attributes server-side and return clear error messages via `MessageError` when attributes are missing or invalid
- Product feeds should define expected custom fields with validation rules (see `proposal.md` for detailed product feed specification)
- Custom attributes may affect pricing; merchants reflect this in the `LineItem` response

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
