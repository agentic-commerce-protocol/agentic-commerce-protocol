# MCP Transport Binding

**Added** -- Model Context Protocol (MCP) transport binding for ACP checkout operations.

## New Files

- **OpenRPC Schema**: `spec/unreleased/openrpc/openrpc.agentic_checkout.json` -- defines 5 MCP tools
- **Binding Specification**: `docs/mcp-binding.md` -- REST-to-MCP mapping conventions
- **MCP Examples**: `examples/unreleased/examples.mcp.agentic_checkout.json`

## MCP Tools

- `create_checkout_session` -- maps to POST /checkout_sessions
- `get_checkout_session` -- maps to GET /checkout_sessions/{id}
- `update_checkout_session` -- maps to POST /checkout_sessions/{id}
- `complete_checkout_session` -- maps to POST /checkout_sessions/{id}/complete
- `cancel_checkout_session` -- maps to POST /checkout_sessions/{id}/cancel

## Design Decisions

- Argument structure: `meta` (headers) / `id` (path param) / `payload` (request body)
- `payload` $refs existing ACP request schemas directly -- no schema duplication
- Auth handled via MCP server configuration, not per-request
- Errors use uniform -32000 with ACP Error object in JSON-RPC error.data

**Files changed:** spec/unreleased/openrpc/openrpc.agentic_checkout.json,
docs/mcp-binding.md, examples/unreleased/examples.mcp.agentic_checkout.json
