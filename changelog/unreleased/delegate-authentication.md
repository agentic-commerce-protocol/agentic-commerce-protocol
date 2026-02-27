# Unreleased Changes

## Delegate Authentication 

This RFC defines a standardized REST API contract for **delegated consumer authentication**. It enables agents to execute 3DS2 browser-based authentication directly with merchant specified authentication providers. 

### Changes

- **Delegate Authentication API**: Established a session-based authentication lifecycle (Create → Authenticate → Retrieve) to manage 3DS2 states across asynchronous browser actions.
- **Data Models**: Defined schemas for `PaymentMethod`, `BrowserInfo` and `AuthenticationResult` (Cryptograms and ECI).
- **Webhook Definitions**: Added support for asynchronous notifications, including Fingerprint completion, Challenge results, and an optional RReq webhook to prevent browser-to-backend race conditions.

### Benefits

- **Standardization**: Provides a single contract for agents to interact with any compliant 3DS2 provider.

### Files Created
- `rfcs/rfc.delegate_authentication.md`
- `spec/unreleased/json-schema/schema.delegate_authentication.json`
- `spec/unreleased/openapi/openapi.delegate_authentication.yaml`
- `examples/unreleased/examples.delegate_authentication.json`