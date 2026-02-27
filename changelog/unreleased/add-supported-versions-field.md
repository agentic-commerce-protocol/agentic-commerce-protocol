# Unreleased Changes

## Add `supported_versions` Field to Version Mismatch Error Responses

When an ACP server rejects a request due to missing or unsupported `API-Version` header, agents previously had no programmatic way to discover which versions the server supports. This change adds guidance and schema support for a `supported_versions` array in error responses.

### Changes

- **RFC Documentation**: Added guidance to Section 2.1 (Initialization) in both `rfc.agentic_checkout.md` and `rfc.delegate_payment.md` specifying that servers **SHOULD** include `supported_versions` array when rejecting version-related requests, and **MAY** use `unsupported_api_version` or `missing_api_version` as well-known error codes.

- **Schema Updates**: Added optional `supported_versions` field to the `Error` schema in both `schema.agentic_checkout.json` and `schema.delegate_payment_schema.json`.

### Example Error Response

```json
{
  "type": "invalid_request",
  "code": "unsupported_api_version",
  "message": "API version '2025-01-01' is not supported",
  "supported_versions": ["2026-01-30", "2025-09-29"]
}
```

### Benefits

- Agents can programmatically discover supported versions and retry
- Enables version negotiation without out-of-band discovery
- Low implementation burden (optional field)
- Fully backward compatible

### Related

- Closes issue #95
