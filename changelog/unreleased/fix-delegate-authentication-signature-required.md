## Require Signature header on Delegate Authentication OpenAPI

`rfcs/rfc.delegate_authentication.md` §3.1 marks `Signature` as **REQUIRED** on client request headers. The machine-readable `spec/2026-04-17/openapi/openapi.delegate_authentication.yaml` had `required: false`, so codegen clients and validators accepted unsigned create/authenticate calls where the static bearer key was the only control on an endpoint that accepts card data and mints 3DS sessions.

### Changes
- Set `components.parameters.Signature.required` to `true` and cite the RFC requirement in the description.
- Left `Timestamp` optional (RFC §3.1 lists it as RECOMMENDED).

### Files Updated
- `spec/2026-04-17/openapi/openapi.delegate_authentication.yaml`

### Reference
- Sibling of open PR aligning Delegate Payment Signature/Timestamp with its RFC MUST language
