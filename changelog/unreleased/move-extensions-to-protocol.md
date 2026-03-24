# Move Extensions to Protocol

**Changed** -- extension declarations now live under `protocol` instead of `capabilities` in unreleased ACP checkout response and discovery payloads.

## What Changed

- **Checkout responses** now return active session extensions in `protocol.extensions`.
- **Discovery** now exposes supported extensions in `protocol.extensions` instead of `capabilities.extensions`.
- **Capabilities cleanup** keeps `capabilities` focused on negotiated payment and intervention behavior.

## Files Changed

- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
- `spec/unreleased/json-schema/schema.extension.json`
- `examples/unreleased/examples.agentic_checkout.json`
- `rfcs/rfc.extensions.md`
- `rfcs/rfc.discount_extension.md`
- `rfcs/rfc.discovery.md`
