## Fix Feed API host and array bounds

Aligns the Feed API OpenAPI server URL with the Product Feeds RFC by using an
agent-hosted example origin. Also tightens feed validation so product upserts
must include at least one product and each product must include at least one
variant.

### Affected files

- `spec/2026-04-17/openapi/openapi.feed.yaml`
- `spec/2026-04-17/json-schema/schema.feed.json`
- `spec/unreleased/openapi/openapi.feed.yaml`
- `spec/unreleased/json-schema/schema.feed.json`
