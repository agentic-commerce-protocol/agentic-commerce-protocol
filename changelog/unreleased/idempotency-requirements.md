# Unreleased Changes

## Mandatory Idempotency Requirements and Guarantees

Agents retrying failed or timed-out requests had no protocol-level guarantee of safe replay. This change makes the `Idempotency-Key` header mandatory on all POST requests and defines explicit error responses for missing keys, in-flight collisions, and payload mismatches.

### Changes

- **IdempotencyKey parameter**: Changed from `required: false` to `required: true` on both Agentic Checkout and Delegate Payment APIs. Added `maxLength: 255` constraint. UUID v4 recommended.

- **IdempotencyKey scoping**: Moved `IdempotencyKey` out of path-level parameters on `/checkout_sessions/{id}` so GET does not inherit the now-required header.

- **Idempotent-Replayed response header**: Added to all POST 2xx responses. Set to `"true"` when the response is a cached replay.

- **400 — idempotency_key_required**: Returned when `Idempotency-Key` header is missing from a POST request.

- **409 — idempotency_in_flight**: Returned when a request with the same key is still being processed. Includes `Retry-After` header.

- **422 — idempotency_conflict**: Returned when an `Idempotency-Key` is reused with a different request body.

- **Error.type enum**: Removed `request_not_idempotent` from the Agentic Checkout Error schema. All idempotency errors now use `type: invalid_request` with specific codes.

- **Error.code enum** (Delegate Payment): Added `idempotency_key_required` and `idempotency_in_flight`.

- **Examples**: Added idempotency error examples to both Agentic Checkout and Delegate Payment example files.

### Related

- Closes issue #120
