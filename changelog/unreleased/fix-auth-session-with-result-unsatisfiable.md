## Fix unsatisfiable authentication_result in DelegateAuthenticationSessionWithResult

**Fixed** a schema bug that makes `authentication_result` impossible to set on a
valid `DelegateAuthenticationSessionWithResult`, even though that field is the
only thing the type adds.

`DelegateAuthenticationSessionWithResult` is
`allOf: [DelegateAuthenticationSessionBase, { properties: { authentication_result } }]`.
The base sets `additionalProperties: false` and does not declare
`authentication_result`. In draft 2020-12, `additionalProperties` only considers
the `properties` of the same schema object, not properties added by a sibling
`allOf` branch. So the base subschema treats `authentication_result` as an unknown
property and rejects it, which fails the whole `allOf`. Any object that includes
`authentication_result` is therefore unsatisfiable.

What this breaks:

- The `200` response of the retrieve-authentication-session operation references
  this schema.
- The schema's own embedded `example`/`examples` include `authentication_result`,
  so the schema does not validate the examples it ships with.
- Every `retrieve_session_response_*` example that carries a result fails
  validation. Ajv, Spectral, Redocly, and openapi-generator all reject them.

### Fix

Declare `authentication_result` as an optional property on
`DelegateAuthenticationSessionBase` so `additionalProperties: false` permits it.
This is the same pattern the spec already uses for `CheckoutSessionWithOrder`,
where `order` lives on `CheckoutSessionBase` and the `WithOrder` variant builds on
top. It stays optional because a terminal session does not always have a 3DS
result (the `expired` example only has `authentication_session_id` and `status`),
so requiring it would reject valid responses.

No example files changed. The examples were already correct; the schema was wrong.

### Files Updated

- `spec/unreleased/json-schema/schema.delegate_authentication.json`
- `spec/unreleased/openapi/openapi.delegate_authentication.yaml`
