# Markdown Specification (CommonMark)

**Changed** -- formalized markdown semantics for `content_type: "markdown"` fields.

When `content_type` is set to `"markdown"`, content MUST conform to
[CommonMark version 0.31.2](https://spec.commonmark.org/0.31.2/). Raw HTML
elements MUST NOT be included. Agents MUST render using a CommonMark-compliant
parser with raw HTML output disabled or sanitized.

Affected types: Disclosure, MessageInfo, MessageWarning, MessageError.

**Files changed:** `spec/unreleased/json-schema/schema.agentic_checkout.json`, `spec/unreleased/openapi/openapi.agentic_checkout.yaml`, `rfcs/rfc.agentic_checkout.md`
