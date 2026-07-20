# Unreleased Changes

## Make allowance.checkout_session_id optional on delegate_payment endpoint

### Breaking Changes

- The `allowance.checkout_session_id` field becomes optional. This is breaking for server implementers who may today utilize it.

### Files Updated

- `spec/unreleased/json-schema/schema.delegate_payment.json`
- `spec/unreleased/openapi/openapi.delegate_payment.yaml`
