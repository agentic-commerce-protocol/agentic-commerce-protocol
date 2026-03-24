# Feed API

**Added** – an unreleased Feed API surface for feed metadata and product catalog management.

## New API Surface

- `POST /feeds` to create feed metadata
- `GET /feeds/{id}` to retrieve feed metadata
- `GET /feeds/{id}/products` to retrieve the current product set
- `PATCH /feeds/{id}/products` to partially upsert products by `Product.id`

## File Ingestion Format

- `metadata.json` uses the `FeedMetadata` shape
- `products.jsonl` contains one `Product` object per line
- file ingestion performs full replacement of the feed's product set
- partial updates are only supported through `PATCH /feeds/{id}/products`

## Deferred

- promotions are intentionally deferred to a stacked follow-up PR
