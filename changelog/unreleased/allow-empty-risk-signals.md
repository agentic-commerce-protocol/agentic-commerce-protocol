# Unreleased Changes

## Allow empty risk_signals array 

The current implementation of `delegate_payment` does not always provide an array of at least size 1 in the `risk_signals` array. 

### Changes

- **Risk signals:** `minItems` of `1` on the `risk_signals` field is removed. 

### Breaking Changes

None.

### Files Updated

- `spec/unreleased/json-schema/schema.delegate_payment.json`
- `spec/unreleased/openapi/openapi.delegate_payment.yaml`
