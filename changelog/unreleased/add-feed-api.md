# Feed API

**Added** – an unreleased Feed API surface for feed metadata and product catalog management.

## New API Surface

These endpoints are hosted by Agents and called by merchants. The Feed API is a
push model: merchants push product catalog metadata and product records to
Agents, rather than Agents pulling catalog data from merchant-hosted endpoints.

- `POST /feeds` for merchants to create feed metadata on an Agent-hosted feed service
- `GET /feeds/{id}` for merchants to retrieve feed metadata from the Agent
- `GET /feeds/{id}/products` for merchants to retrieve the current Agent-hosted product set
- `PATCH /feeds/{id}/products` for merchants to partially upsert products by `Product.id` into the Agent-hosted feed

## File Ingestion Format

- `metadata.json` uses the `FeedMetadata` shape
- `products.jsonl` contains one `Product` object per line
- file ingestion performs full replacement of the feed's product set
- partial updates are only supported through `PATCH /feeds/{id}/products`

## Deferred

- promotions are intentionally deferred to a stacked follow-up PR
