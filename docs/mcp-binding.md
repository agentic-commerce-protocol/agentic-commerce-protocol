# MCP Transport Binding for Agentic Checkout

This document specifies the Model Context Protocol (MCP) binding for the
Agentic Commerce Protocol checkout API. It defines how ACP's REST operations
map to MCP tools over JSON-RPC 2.0.

## Overview

MCP is a second transport binding for ACP, alongside REST. It allows AI agents
to invoke checkout operations as native MCP tool calls instead of constructing
HTTP requests. The binding is purely additive — the REST API, JSON Schemas, and
protocol semantics are unchanged.

All domain schemas are reused from the existing JSON Schema bundle
(`schema.agentic_checkout.json`). The OpenRPC schema at
`spec/unreleased/openrpc/openrpc.agentic_checkout.json` references these via
`$ref`. No domain types are duplicated. These references use relative file
paths for spec-time validation. Implementers **MUST** resolve and bundle all
`$ref` targets before serving tool schemas to MCP clients.

### Transport

ACP MCP servers use JSON-RPC 2.0 over MCP's
[Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http)
transport. The server exposes a single HTTP endpoint (e.g., `/mcp`) that is
separate from the REST endpoint paths.

### Discovery

ACP does not require a discovery profile for MCP. Capability negotiation
happens inline (the agent sends `capabilities` in the create request, the
merchant responds with the negotiated set), so there is no pre-session
discovery phase. The MCP endpoint URL is communicated out-of-band, the same
way REST endpoint URLs are communicated today (documentation, onboarding, API
configuration).

The required `meta.api_version` field presumes the agent knows a compatible
API version before its first tool call. Agents may obtain this from merchant
documentation, or via the Discovery Capabilities mechanism
([SEP #135](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/135))
once available.

## Tool Definitions

Each ACP REST operation maps to one MCP tool:

| MCP Tool                     | REST Operation                                  | Description                                             |
| :--------------------------- | :---------------------------------------------- | :------------------------------------------------------ |
| `create_checkout_session`    | `POST /checkout_sessions`                       | Create a checkout session                               |
| `get_checkout_session`       | `GET /checkout_sessions/{id}`                   | Retrieve the current state of a checkout session        |
| `update_checkout_session`    | `POST /checkout_sessions/{id}`                  | Update items, fulfillment details, or selected options  |
| `complete_checkout_session`  | `POST /checkout_sessions/{id}/complete`         | Submit payment and finalize the order                   |
| `cancel_checkout_session`    | `POST /checkout_sessions/{id}/cancel`           | Cancel a session, optionally with an intent trace       |

All 5 operations are exposed as MCP **Tools**, not Resources. Checkout sessions
are transient, agent-driven objects — the agent creates, mutates, and completes
them in a tight sequence. MCP Resources are better suited for future
capabilities like product catalog access or order history, where URI-based
addressing and subscriptions make more sense.

## Argument Structure

Every tool call uses a consistent three-field argument structure:

```json
{
  "meta": { ... },
  "id": "...",
  "payload": { ... }
}
```

| Field     | Purpose                              | Present on                                    |
| :-------- | :----------------------------------- | :-------------------------------------------- |
| `meta`    | Protocol metadata (from HTTP headers)| All tools (required)                          |
| `id`      | Resource identifier (from path param)| get, update, complete, cancel (required)      |
| `payload` | Domain data (from request body)      | create, update, complete (required); cancel (optional); get (absent) |

When `payload` is marked optional (e.g., `cancel_checkout_session`), omitting
the field entirely is valid. Servers **MUST NOT** require `payload: null`.

### Why `payload`?

Wrapping the domain request body in a `payload` field means the OpenRPC schema
can `$ref` directly to existing ACP request schemas without composition:

| Tool                         | `payload` schema reference          |
| :--------------------------- | :---------------------------------- |
| `create_checkout_session`    | `CheckoutSessionCreateRequest`      |
| `update_checkout_session`    | `CheckoutSessionUpdateRequest`      |
| `complete_checkout_session`  | `CheckoutSessionCompleteRequest`    |
| `cancel_checkout_session`    | `CancelSessionRequest`              |
| `get_checkout_session`       | *(no payload)*                      |

This means the `payload` contents match the existing REST request body schemas
exactly. No schema duplication or composition is needed.

## Header Mapping

ACP uses several protocol-level HTTP headers (see
[required headers](https://www.agenticcommerce.dev/docs/reference/checkout#required-headers)).
These map to fields in the `meta` object:

| HTTP Header        | MCP Field              | Required | Notes                                          |
| :----------------- | :--------------------- | :------- | :--------------------------------------------- |
| `API-Version`      | `meta.api_version`     | Yes      | Date string, e.g. `"2026-01-30"`              |
| `Idempotency-Key`  | `meta.idempotency_key` | No       | Recommended for create and complete            |
| `Request-Id`       | `meta.request_id`      | No       | Correlation ID                                 |
| `User-Agent`       | `meta.user_agent`      | No       | Agent identification                           |
| `Accept-Language`   | `meta.accept_language` | No       | Locale preference                              |
| `Signature`        | `meta.signature`       | No       | Request signing                                |
| `Timestamp`        | `meta.timestamp`       | No       | Request signing timestamp (RFC 3339)           |
| `Authorization`    | *(out-of-band)*        | —        | Handled via MCP server auth, not per-request   |

The `Authorization` header is intentionally excluded from `meta`. MCP servers
handle authentication at the connection level (via server configuration or
OAuth), not per tool call. Including bearer tokens in tool arguments would
expose them in tool schemas visible to LLMs.

The `meta` object is extensible (`additionalProperties: true` in the OpenRPC
schema). Servers **SHOULD** ignore unrecognized `meta` fields to allow
forward-compatible header additions without requiring a schema version bump.
If future ACP versions introduce new protocol-level headers, corresponding
`meta` fields SHOULD be added to the MCP binding.

## Response Mapping

Successful REST responses (2xx) map to JSON-RPC `result` containing the same
response body. The full `CheckoutSession` or `CheckoutSessionWithOrder` object
is returned as-is:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "id": "cs_abc123",
    "status": "incomplete",
    "line_items": [ ... ],
    "totals": [ ... ],
    "capabilities": { ... },
    "messages": [],
    "links": []
  }
}
```

## Error Handling

REST error responses (4xx, 5xx) map to JSON-RPC `error` objects. ACP's `Error`
schema (`type`, `code`, `message`, `param`) is placed in the JSON-RPC error's
`data` field:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Checkout session not found",
    "data": {
      "type": "invalid_request",
      "code": "session_not_found",
      "message": "Checkout session not found",
      "param": "id"
    }
  }
}
```

All ACP errors use JSON-RPC error code `-32000` (server error) uniformly. The
useful error semantics are in ACP's `Error` object in `data` -- consumers
**MUST** inspect `data.type` and `data.code` to understand the error, not the
JSON-RPC error code. Clients that display or log JSON-RPC error codes without
inspecting `data` will see a uniform `-32000` for all ACP errors. This is a
known tradeoff: the JSON-RPC error code layer is intentionally thin, and the
ACP error model in `data` carries the actionable semantics.

The exception is `-32602` (Invalid params), which is reserved for malformed
requests that fail at the JSON-RPC level before reaching ACP business logic
(e.g., missing required fields in the JSON-RPC envelope itself).

### ACP Error Types in `data`

| `data.type`              | Meaning                                           |
| :----------------------- | :------------------------------------------------ |
| `invalid_request`        | Malformed request, missing required fields         |
| `request_not_idempotent` | Idempotency violation                              |
| `processing_error`       | Unexpected server-side failure                     |
| `service_unavailable`    | Temporary unavailability                           |

### Authentication and Authorization Errors

Authentication and authorization failures from the upstream merchant REST API
(HTTP 401, 403) are surfaced as JSON-RPC errors with code `-32000`. The
`data.type` will be `invalid_request` until ACP introduces dedicated
authentication/authorization error types in the core `Error` schema. For
example, a 403 from the merchant propagates as:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Unauthorized access to checkout session",
    "data": {
      "type": "invalid_request",
      "code": "forbidden",
      "message": "Unauthorized access to checkout session"
    }
  }
}
```

MCP server-level auth failures (e.g., invalid OAuth token to the MCP endpoint
itself) are outside the ACP error model and should use standard MCP/JSON-RPC
error handling.

## Capability Negotiation

Unchanged from REST. The `capabilities` object is a field inside `payload` for
`create_checkout_session` (just as it is in the REST request body), and the
negotiated capabilities appear in the response `CheckoutSession` object. The
protocol flow is identical to REST; only the wire format differs.

## Conformance

A conforming ACP MCP server **MUST**:

1. Implement JSON-RPC 2.0 over MCP Streamable HTTP transport.
2. Expose all 5 checkout tools defined in this specification.
3. Accept the `meta` object and apply its fields as protocol-level metadata.
4. Accept the `payload` object and treat its contents as the ACP request body.
5. Return ACP `CheckoutSession` / `CheckoutSessionWithOrder` objects in
   JSON-RPC `result`.
6. Return ACP `Error` objects in JSON-RPC `error.data`.
7. Validate tool inputs against ACP JSON Schemas.

## Scope

This binding covers the Agentic Checkout API surface only. ACP also defines a
Delegate Payment API (`POST /agentic_commerce/delegate_payment`) that agents
use to obtain payment tokens from payment providers. Since delegate payment is
a separate API surface served by a different party (payment provider, not
merchant), it should be addressed in a follow-up SEP.

This is the first MCP binding for ACP. A follow-up SEP will define the MCP
binding for the Delegate Payment API to complete the full agent checkout flow
over MCP.

## Security Considerations

Authentication tokens are not included in tool arguments by design. MCP tool
schemas are visible to the LLM during planning, so keeping authentication at
the MCP server configuration level avoids token exposure in context windows.

Request signing (`meta.signature`, `meta.timestamp`) and idempotency
(`meta.idempotency_key`) are preserved from the REST binding with identical
semantics.

### Proxy Trust Boundary

When an MCP server operates as a proxy to a merchant's REST API, the proxy
processes all tool arguments including payment instrument tokens in
`complete_checkout_session`. Proxy operators that handle payment data
**SHOULD** evaluate PCI DSS scope requirements. Co-locating the MCP server
with the REST backend avoids introducing a new intermediary in the payment
data flow. Third-party hosted proxies that inspect or log payment payloads may
be in PCI scope even if they do not store card data.
