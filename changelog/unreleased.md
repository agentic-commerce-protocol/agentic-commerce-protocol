# Unreleased Changes

## Added

- **RFC: Agentic Checkout Webhook Integration** (`rfcs/rfc.agentic_checkout_webhook.md`)
  - Implementation guidance for merchant-to-platform webhook delivery
  - Multiple authentication options: HMAC-SHA256/SHA512, Ed25519, ECDSA, mutual TLS, API keys
  - Flexible signature format recommendations with examples
  - Retry behavior guidance with suggested backoff schedules
  - Order status value recommendations (created, manual_review, confirmed, canceled, shipped, fulfilled)
  - Security considerations including replay attack prevention and secret management
  - Implementation examples in Python, Node.js demonstrating different auth approaches
  - Operational considerations for monitoring, idempotency, and event ordering
  - Minimum conformance requirements for merchants and platforms
  - Open questions section inviting community feedback on future enhancements

## Changed

- N/A

## Fixed

- N/A

## Deprecated

- N/A

