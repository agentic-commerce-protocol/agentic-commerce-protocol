# Discovery Well-Known Document

**Added** -- platform-level discovery document at `/.well-known/acp.json` for pre-session capability checks.

## New Document

- **`/.well-known/acp.json`** -- A static, publicly accessible JSON document served at the origin
  root per RFC 8615. Enables agents to determine ACP support, discover the API base URL, check
  version compatibility, and learn available capabilities before creating a checkout session.

## New Schemas

- **DiscoveryResponse**: Top-level document containing protocol metadata, API base URL, supported
  transports, and a capabilities object.
- **DiscoveryCapabilities**: Platform-level capabilities wrapper containing services, extensions,
  intervention types, supported currencies, and supported locales.
- **DiscoveryProtocol**: Protocol identification with name (`acp`), current version,
  supported version history (chronologically ordered), and documentation URL.
- **DiscoveryExtension**: Lightweight extension declaration with name and optional spec URL.

## Design Notes

- No authentication required -- the document is publicly accessible.
- Platform-scoped -- returns information that is stable across all merchants and sessions.
- Merchant-specific and session-specific capabilities (payment methods, payment handlers)
  remain in the inline `capabilities` object on `POST /checkout_sessions`.
- Responses SHOULD include `Cache-Control: public, max-age=3600` as a recommended minimum.
- `transports` field advertises available transport bindings (`rest`, `mcp`), cross-referencing
  the MCP Transport Binding (SEP #135).
- `services`, `intervention_types`, and `transports` enums are closed per API version.

**Files changed:**

- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `rfcs/rfc.discovery.md`
- `examples/unreleased/examples.agentic_checkout.json`
- `docs/mcp-binding.md`
