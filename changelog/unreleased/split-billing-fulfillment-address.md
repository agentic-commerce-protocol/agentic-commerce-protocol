## Split Address into BillingAddress and FulfillmentAddress

### Motivation

A single `Address` model served two contexts with genuinely different requirements.
Fulfillment needs a complete, deliverable address. Billing does not: for address
verification (AVS), tax determination, and 3DS risk assessment, a postal code and
country are sufficient.

Because `Address` required `name`, `line_one`, `city`, and `state`, agents had no way
to pass a partial billing address. They were forced to either collect a full address
the merchant did not need — adding friction at the highest-drop-off point in checkout
— or fabricate placeholder values to satisfy the schema. Neither is acceptable.

Splitting the model lets each context state its own requirements honestly.

### Breaking Changes

- The `Address` model is removed. It is replaced by `BillingAddress` and
  `FulfillmentAddress`.
- `BillingAddress` requires only `country` and `postal_code`. `name`, `line_one`,
  `line_two`, `city`, and `state` are now optional.

Migration:

- **Producers** (agents sending addresses) need no data changes. Every address that
  validated against `Address` still validates against its replacement — the required
  set was narrowed, never widened.
- **Consumers** (merchants and PSPs reading billing addresses) must treat `name`,
  `line_one`, `city`, and `state` as optional on `BillingAddress` and handle their
  absence. Code that assumes those fields are present will break.
- Type references named `Address` must be renamed to `BillingAddress` or
  `FulfillmentAddress` depending on context.

### Changes

- Added `BillingAddress`: `country` and `postal_code` required; all other fields optional.
- Added `FulfillmentAddress`: identical field requirements to the previous `Address`
  (all fields except `line_two` required).
- Retargeted every `Address` reference to its context-appropriate type:
  - `PaymentData.billing_address` → `BillingAddress`
  - `DelegatePaymentRequest.billing_address` → `BillingAddress`
  - `ShopperDetails.address` (3DS authentication) → `BillingAddress`
  - `FulfillmentDetails.address` → `FulfillmentAddress`
  - `FulfillmentOptionPickup` location address → `FulfillmentAddress`
  - `Fulfillment.destination` → `FulfillmentAddress`
- Per-file length constraints (`maxLength` on `name`, `line_one`, `city`,
  `postal_code`; `minLength`/`maxLength` on `country`) are preserved unchanged in the
  delegate payment and delegate authentication specs.

### Files Updated

- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
- `spec/unreleased/openapi/openapi.delegate_payment.yaml`
- `spec/unreleased/openapi/openapi.delegate_authentication.yaml`
- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `spec/unreleased/json-schema/schema.delegate_payment.json`
- `spec/unreleased/json-schema/schema.delegate_authentication.json`
- `rfcs/rfc.agentic_checkout.md`
- `rfcs/rfc.delegate_payment.md`
- `rfcs/rfc.delegate_authentication.md`
- `rfcs/rfc.orders.md`

### Reference

- PR: #10
