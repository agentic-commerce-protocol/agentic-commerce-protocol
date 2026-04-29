## Add UpsertProductsResponse to feed JSON Schema bundle

**Fixed** an inconsistency between the feed OpenAPI spec and the JSON Schema bundle. `UpsertProductsResponse` is defined in `openapi.feed.yaml` and referenced as the `200` response schema for `PATCH /feeds/{id}/products`, but it was missing from `schema.feed.json`. Tools that consume the JSON Schema bundle (validators, code generators, language SDKs) had no definition for the upsert acknowledgement shape and could not validate or generate types for it.

The companion `UpsertProductsRequest` schema was already mirrored in both files; the response counterpart was not. The RFC's "Required Spec Updates" section in `rfcs/rfc.product_feeds.md` §9 already lists the upsert response schema among the required JSON Schema additions, so this change completes that requirement rather than introducing new surface.

### Changes
- Added `UpsertProductsResponse` definition to the feed JSON Schema bundle, mirroring the OpenAPI shape (`id: string`, `accepted: boolean`)
- Added an `upsert_products_response` example to the feed examples file
- Named the schema in §5.4 of the Product Feeds RFC so the response shape is documented as a reusable type

### Files Updated
- `spec/unreleased/json-schema/schema.feed.json`
- `examples/unreleased/examples.feed.json`
- `rfcs/rfc.product_feeds.md`

### Reference
- Original Feed API PR: #190
- RFC §9 (Required Spec Updates) lists "upsert response schemas" among the JSON Schema additions required for the Feed API
