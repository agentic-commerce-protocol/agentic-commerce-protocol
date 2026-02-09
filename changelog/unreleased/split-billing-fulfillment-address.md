# Split Address into BillingAddress and FulfillmentAddress

## Breaking Changes

### Address Schema Split

- **Replaced `Address` with two distinct types:**
  - **`BillingAddress`**: Used for payment billing addresses. Only `postal_code` and `country` are required. All other fields (`name`, `line_one`, `line_two`, `city`, `state`) are optional.
  - **`FulfillmentAddress`**: Used for shipping/delivery addresses. All fields are required: `name`, `line_one`, `city`, `state`, `country`, `postal_code`. Only `line_two` is optional.

- **Motivation**: The previous `Address` schema required all fields regardless of context, making it impossible to provide only billing information (e.g., postal code for AVS/tax) without a full address. Providing fewer address fields can help with purchase conversion.

- **Migration Guide**:
  - **Billing addresses** (in `PaymentData.billing_address` and `DelegatePaymentRequest.billing_address`): Update to `BillingAddress` type. Minimum required fields are now `postal_code` and `country`.
  - **Fulfillment addresses** (in `FulfillmentDetails.address`): Update to `FulfillmentAddress` type. All fields except `line_two` remain required as before.
  - **Existing full addresses remain valid** — this change is backward compatible for implementations that already provide complete address information.

### Files Updated
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
- `spec/unreleased/openapi/openapi.delegate_payment.yaml`
- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `spec/unreleased/json-schema/schema.delegate_payment.json`
- `rfcs/rfc.agentic_checkout.md`
- `rfcs/rfc.delegate_payment.md`
