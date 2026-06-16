# Feed Extensions Framework

**Added** – extends the ACP Extensions Framework to cover product feeds.

## Changes

- **FeedMetadata.extensions**: Added optional `extensions` array to
  `FeedMetadata` that declares which feed extensions are active, reusing
  the existing `ExtensionDeclaration` structure from the checkout
  extension framework.

## Deferred

- Concrete feed extensions (e.g., image attributes) and any necessary
  `additionalProperties` handling on extensible feed objects are
  deferred to follow-up PRs.

## Files Modified
- `spec/unreleased/json-schema/schema.feed.json`
- `spec/unreleased/openapi/openapi.feed.yaml`
- `examples/unreleased/examples.feed.json`
