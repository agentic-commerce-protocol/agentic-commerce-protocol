# IIN field max length 6 → 8

**Delegate Payment API – Changed**

- **IIN field length**: Updated `iin` field `maxLength` from 6 to 8 characters in `PaymentMethodCard` schema to support extended IIN ranges (ISO/IEC 7812-1).
  - `spec/openapi/openapi.delegate_payment.yaml`
  - `spec/json-schema/schema.delegate_payment_schema.json`
  - `rfcs/rfc.delegate_payment.md`
