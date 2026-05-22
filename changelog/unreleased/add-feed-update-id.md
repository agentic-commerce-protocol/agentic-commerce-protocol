## Feed Update ID on Upsert Products Response (SEP #259)

Add agent-generated feed_update_id to UpsertProductsResponse and per-product last_update_id for update version tracking and checkout price provenance.

### Changes

- **UpsertProductsResponse**: Added optional `feed_update_id` field — agent-generated version identifier for each accepted upsert
- **Product**: Added optional `last_update_id` field — tracks the feed_update_id of the most recent upsert that touched each product

### Files Updated

- `spec/unreleased/openapi/openapi.feed.yaml`
- `spec/unreleased/json-schema/schema.feed.json`
- `examples/unreleased/examples.feed.json`

### Reference

- Issue: #259
