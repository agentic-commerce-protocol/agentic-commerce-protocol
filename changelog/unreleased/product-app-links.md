# Product & Variant App Links

Adds an optional `app_links` field to the **Product** and **Variant** types, enabling merchants to declare platform-specific deep link URIs alongside the canonical `url`. Answer engine clients evaluate `app_links` entries in order and fall back to `url` if no entry matches, making this a purely additive, backward-compatible change.

## Changes

- **New schema**: `spec/unreleased/json-schema/schema.app_link.json` — defines the `AppLink` object with required `platform` (enum: `chatgpt`, `other`) and `uri` fields.
- **Updated schema**: `spec/unreleased/json-schema/schema.feed.json` — adds `app_links` array (items `$ref: ./schema.app_link.json`) to `Product` and `Variant` `$defs`; updates `url` descriptions on both types to clarify webview-fallback semantics.
- **Updated examples**: `examples/unreleased/examples.feed.json` — adds `upsert_products_request_with_app_links` example showing `app_links` on both a product and a variant.

## Reference

- SEP: `docs/sep-embedded-app-deep-links.md`
- Related: [SEP #189](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/189) — Product Feeds, [SEP #190](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/190) — Add Product Feeds API
