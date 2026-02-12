# Discovery Capabilities Endpoint

**Added** -- platform-level discovery endpoint for pre-session capability checks.

## New Endpoint

- **`GET /capabilities`** -- Returns the platform's supported ACP capabilities at a high level,
  without requiring authentication. Enables agents to determine ACP support, API version
  compatibility, and available features before creating a checkout session.

## New Schemas

- **DiscoveryResponse**: Top-level response object containing protocol metadata, extensions,
  intervention types, services, supported currencies, and supported locales.
- **DiscoveryProtocol**: Protocol identification with name (`acp`), current version,
  supported version history, and documentation URL.
- **DiscoveryExtension**: Lightweight extension declaration with name and optional spec URL.
  Intentionally simpler than `ExtensionDeclaration` — omits session-level fields like
  `extends` and `schema`.

## Design Notes

- No authentication required — the endpoint is publicly accessible.
- Platform-scoped — returns information that is stable across all merchants and sessions.
- Merchant-specific and session-specific capabilities (payment methods, payment handlers)
  remain in the inline `capabilities` object on `POST /checkout_sessions`.
- Responses SHOULD include `Cache-Control` headers for agent-side caching.

**Files changed:**

- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `rfcs/rfc.discovery.md`
- `examples/unreleased/examples.agentic_checkout.json`
