## Add optional phone_number to delegate payment address

Add optional `phone_number` to the unreleased delegated payment `Address` schema and example payloads.

### Changes
- Add optional `phone_number` to `spec/unreleased/openapi/openapi.delegate_payment.yaml`
- Add optional `phone_number` to `spec/unreleased/json-schema/schema.delegate_payment.json`
- Update `examples/unreleased/examples.delegate_payment.json` to include `phone_number` in the billing address example

### Files Updated
- `spec/unreleased/openapi/openapi.delegate_payment.yaml`
- `spec/unreleased/json-schema/schema.delegate_payment.json`
- `examples/unreleased/examples.delegate_payment.json`
- `changelog/unreleased/add-delegate-payment-phone-number.md`

### Reference
- PR: #<pr-number>
