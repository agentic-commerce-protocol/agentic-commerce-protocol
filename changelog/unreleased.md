# Unreleased Changes

## Delegate Payment API

### Changed
- **IIN field length**: Updated `iin` field `maxLength` from 6 to 8 characters in `PaymentMethodCard` schema to support extended IIN ranges.
  - Updated in: `spec/openapi/openapi.delegate_payment.yaml`
  - Updated in: `spec/json-schema/schema.delegate_payment_schema.json`
  - Updated in: `rfcs/rfc.delegate_payment.md`
