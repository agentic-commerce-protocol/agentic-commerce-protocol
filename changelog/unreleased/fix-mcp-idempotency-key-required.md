## Require Idempotency-Key for MCP tools that change state

The REST binding requires an `Idempotency-Key` header on every POST (SEP #120). The MCP binding maps that header to `meta.idempotency_key` but left it optional for all five checkout tools, so a generated MCP client could retry `complete_checkout_session` without a key.

### Changes

- **OpenRPC**: Added `mutation_meta`, which is `meta` with `idempotency_key` required. `create_checkout_session`, `update_checkout_session`, `complete_checkout_session` and `cancel_checkout_session` now use it. `get_checkout_session` keeps `meta`, where the key stays optional.
- **MCP binding doc**: The header table marks `meta.idempotency_key` as conditional, required for the four tools that change state.
- **Examples**: The update and cancel request examples now carry `idempotency_key`.
- **Validation**: `scripts/validate-consistency.js` checks that the four tools require the `meta` parameter and reject `meta` without the key, that `get_checkout_session` accepts it, and that the MCP request examples satisfy their tool's `meta` schema.

### Files Updated

- `spec/unreleased/openrpc/openrpc.agentic_checkout.json`
- `docs/mcp-binding.md`
- `examples/unreleased/examples.mcp.agentic_checkout.json`
- `scripts/validate-consistency.js`

### Reference

- Issue: #295
- Builds on: #296
