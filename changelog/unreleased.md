# Unreleased Changes

## Version 2025-12-12 - Breaking Changes

This release introduces several breaking changes to the Agentic Commerce Protocol based on learnings from URBN and Etsy adapter implementations.

### 1. Renamed `fulfillment_address` to `fulfillment_details`

**Impact:** Both requests (Create/Update) and all responses

**Change:**
- Old structure: Flat `fulfillment_address` object with address fields only
- New structure: Nested `fulfillment_details` object with optional `name`, `phone`, `email`, and nested `address` object

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
    "phone": "15551234567",
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

### 5. Added optional `shipping_address` to CompleteCheckout request

**Impact:** `CheckoutSessionCompleteRequest` schema

**Change:**
- New optional field `shipping_address` for tax computation on turnkey/on-stripe sellers

**Migration:**
```json
// NEW - optional shipping_address field
{
  "buyer": { ... },
  "payment_data": { ... },
  "shipping_address": {
    "name": "John Doe",
    "line_one": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "country": "US",
    "postal_code": "94102"
  }
}
```

**Rationale:** Supports tax computation at checkout time for sellers that need accurate shipping address before finalizing the order.

### 6. Order details in complete response

**Impact:** `CheckoutSessionWithOrder` response schema

**Change:**
- The `order` object with `id`, `checkout_session_id`, and `permalink_url` is now explicitly documented and required in complete responses

**Migration:** No change needed - this was already in the spec but is now formally required.

---

## Version Compatibility

- Clients MUST send `API-Version: 2025-12-12` header
- Previous version `2025-09-29` is deprecated
- All changes are breaking and require client updates

## Files Updated

- `spec/json-schema/schema.agentic_checkout.json`
- `spec/openapi/openapi.agentic_checkout.yaml`
- `examples/examples.agentic_checkout.json`
- `rfcs/rfc.agentic_checkout.md`
