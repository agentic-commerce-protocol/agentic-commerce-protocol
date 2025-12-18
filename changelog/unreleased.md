# Unreleased Changes

## Updates

- Added new python library for validations
- Consistency updates to the Spec and Examples
- Updated Address fields
- Updated Buyer object fields on checkout
- Updated PaymentProvider fields on checkout response
- Updated Response fields on delegate payment response

## Checkout API Spec

### Changed

- **Buyer fields**: Replaced field `first_name` and field `last_name` with `name` in `Buyer` schema.
- **PaymentProvider fields**: Added field `merchant_id` in `PaymentProvider` schema.
- **Address fields**: Added field `phone_number` in `Address` schema.
- **Examples**:
  - Added missing "Express" fulfillment option (`fulfillment_option_456`) to `cancel_checkout_session_response` in `examples/examples.agentic_checkout.json` for consistency with other responses.

## Delegate Payment API Spec

### Changed

- **IIN field length**: Updated `iin` field `maxLength` from 6 to 8 characters in `PaymentMethodCard` schema to support extended IIN ranges.
- **created field rename**: Replaced `create` field with `created_at` field in `DelegatePaymentResponse` schema.
- **Address fields**: Added field `phone_number` in `Address` schema.
