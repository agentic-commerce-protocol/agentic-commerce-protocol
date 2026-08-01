# Delegate Payment — Error type and code enums extended

**Added** – New values in the `Error` schema so all documented HTTP error responses validate against the schema.

### Schema enums (before)

- **type:** `invalid_request`, `rate_limit_exceeded`, `processing_error`, `service_unavailable`
- **code:** `invalid_card`, `duplicate_request`, `idempotency_conflict`, `too_many_requests`, `idempotency_key_required`, `idempotency_in_flight`

### OpenAPI examples use

- **401 Unauthorized:** `type: unauthorized`, `code: unauthorized`
- **500 Processing error:** `type: internal_server_error`, `code: internal_server_error`
- **503 Service unavailable:** `type: service_unavailable`, `code: service_unavailable` (type was already in enum; code was not)

### Problem

401 and 500 examples were invalid against the Error schema (type and code not in enums). The 503 example had a valid type but an invalid code.

### What we added and why

- **Error.type** — added `unauthorized` (so 401 responses validate) and `internal_server_error` (so 500 responses have a distinct type).
- **Error.code** — added `unauthorized`, `internal_server_error`, and `service_unavailable` (so all documented examples validate).

### Forward compatibility (RFC)

To avoid breaking clients when new error codes are added, the delegate payment RFC now includes explicit forward-compatibility guidance in **§4.2 Error**:

- The `type` and `code` enums are **extensible**; new values MAY be added in future spec versions without a breaking change.
- Implementations **MUST NOT** reject responses with unrecognized `type` or `code` and **SHOULD** fall back to generic error handling.
- Strict enum validation of error responses is **NOT RECOMMENDED**.

This aligns with intent traces (§7.2) and capability negotiation (§6.4, §7.3) and protects future additions (e.g. x402 or auth error codes).

### Files changed

- `spec/unreleased/json-schema/schema.delegate_payment.json` — Error type and code enums
- `spec/unreleased/openapi/openapi.delegate_payment.yaml` — Error type and code enums
- `examples/unreleased/examples.delegate_payment.json` — added error examples for unauthorized, internal_server_error, service_unavailable
- `rfcs/rfc.delegate_payment.md` — added **Forward compatibility for error codes** under §4.2
