## Fix MessageInfo, MessageWarning, and MessageError examples

Corrected examples for all three message types in the unreleased OpenAPI spec and JSON Schema bundle. The examples introduced in #140 used fields that do not exist in any of the schemas (`id`, `message`, `display_context`) and omitted all required fields (`type`, `content_type`, `content`). Because all three schemas declare `additionalProperties: false`, the previous examples would fail schema validation in any tool that validates inline OpenAPI examples (e.g. Spectral, Redocly, openapi-generator).

### Changes
- `MessageInfo` example: replaced `id`/`message`/`display_context` with valid `type`/`content_type`/`content` fields
- `MessageWarning` example: replaced `id`/`message` with valid `type`/`content_type`/`content` fields; retained valid `code` and `param`
- `MessageError` example: replaced `id`/`message` with valid `type`/`content_type`/`content` fields; retained valid `code` and `param`

### Files Updated
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
- `spec/unreleased/json-schema/schema.agentic_checkout.json`
