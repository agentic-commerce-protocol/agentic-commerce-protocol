# RFC: Agentic Commerce - Product Feeds

**Status:** Proposal
**Version:** unreleased
**Scope:** Product catalog publication, discovery, and consumption for agent-driven commerce flows

This RFC introduces **Product Feeds** for the Agentic Commerce Protocol (ACP).
Product feeds give merchants and seller platforms a standard way to publish
product catalog data that agents can consume before checkout. Feeds provide the
product, variant, price, availability, media, category, and seller information
an agent needs to discover relevant products, explain choices to buyers, and
create checkout sessions using merchant-recognized item identifiers.

Product feeds are a discovery and merchandising surface. Checkout remains the
authoritative surface for pricing, taxes, fulfillment, payment, policy checks,
and order creation.

---

## 1. Motivation

ACP currently standardizes checkout and related post-purchase surfaces, but
agents still need a reliable way to answer a prior question: **"What can this
merchant sell, and which exact item should be passed into checkout?"**

Without a standard feed:

- **Agents rely on scraping or proprietary catalog APIs**: Product discovery is
  brittle, incomplete, and inconsistent across merchants.
- **Checkout item identifiers are hard to obtain**: An agent may find a product
  page but not know the variant ID, SKU, or item identifier accepted by
  `POST /checkout_sessions`.
- **Availability and pricing context is stale or missing**: Agents cannot
  confidently recommend items, filter out unavailable variants, or explain
  price differences before checkout.
- **Merchants lose control over product representation**: Agents may infer
  names, images, variants, seller details, or policy links from unstructured
  pages rather than using merchant-provided data.
- **Cross-merchant journeys are hard to normalize**: Comparing products across
  merchants requires a common product and variant shape.

Product feeds address these gaps by giving merchants a structured, ACP-native
catalog surface that agents can ingest, index, and use to prepare checkout
requests.

### 1.1 What Agents Do With a Feed

An agent consumes a product feed to:

1. Build or refresh a searchable index of the merchant's products and variants.
2. Match buyer intent to concrete purchasable variants, using attributes such as
   title, description, category, condition, option values, price, availability,
   seller, marketplace, media, and canonical product URLs.
3. Present product choices to the buyer with enough context for review, such as
   images, price, stock status, seller identity, and policy links.
4. Select the merchant-recognized item identifier to pass into checkout.
5. Re-check product context shortly before checkout so the buyer is not acting
   on obviously stale price or availability information.

Feeds do not authorize a purchase. They provide the input an agent needs to
decide which checkout request to create.

### 1.2 User Journeys

#### Discovery to Checkout

1. A buyer asks: "Find me a red cotton t-shirt under $25 that can arrive next
   week."
2. The agent uses the merchant's product feed to find matching `Product` and
   `Variant` records.
3. The agent filters variants by price, availability, condition, category, and
   option values such as color and size.
4. The agent presents the buyer with a small set of options, including product
   images and current feed prices.
5. After the buyer chooses a variant, the agent creates a checkout session using
   the feed's checkout-compatible item identifier.
6. The merchant returns authoritative checkout state, including final line item
   details, tax, fulfillment options, messages, and totals.

#### Comparison Across Merchants

1. A buyer asks: "Compare noise-canceling headphones from Merchant A and
   Merchant B."
2. The agent consumes feeds from both merchants and normalizes product and
   variant fields into an internal comparison model.
3. The agent compares product attributes, media, price, availability, seller
   identity, condition, and canonical URLs.
4. The buyer selects an option.
5. The agent proceeds with the chosen merchant's ACP checkout flow.

#### Availability Change Before Checkout

1. A buyer saves a recommendation and returns later.
2. The merchant has since applied an incremental feed update marking the
   selected variant as `out_of_stock`.
3. Before checkout, the agent refreshes the feed metadata or product set.
4. The agent sees the updated availability and asks the buyer to choose a
   substitute rather than starting a checkout that is likely to fail.

#### Merchant-Curated Agent Merchandising

1. A merchant publishes product titles, descriptions, category assignments,
   media, barcodes, seller information, and policy links in a feed.
2. Agents use the merchant-provided content instead of scraping storefront HTML.
3. The merchant controls which variants are purchasable by agents and how those
   products are represented before checkout.

---

## 2. Goals and Non-Goals

### 2.1 Goals

1. **Structured product discovery**: Define a product and variant model agents
   can ingest without scraping storefront pages.
2. **Checkout compatibility**: Ensure feed identifiers can be used to construct
   checkout requests or mapped deterministically to checkout item identifiers.
3. **Merchant-controlled content**: Allow merchants to provide canonical names,
   descriptions, URLs, images, prices, categories, seller details, and
   availability signals.
4. **Publication flexibility**: Support both offline full-snapshot ingestion and
   API-based incremental upserts.
5. **Fresh-enough agent indexes**: Provide metadata and update semantics that
   let agents detect when cached catalog data should be refreshed.
6. **Additive protocol surface**: Introduce feeds as an optional ACP service that
   existing checkout integrations can adopt incrementally.

### 2.2 Non-Goals

- **Authoritative checkout pricing**: Feed prices are discovery-time signals.
  Checkout session responses remain authoritative for pricing, tax,
  fulfillment, discounts, fees, and totals.
- **Search or ranking algorithms**: This RFC defines the data surface, not how
  agents rank products or personalize recommendations.
- **Promotion and coupon modeling**: Promotions are intentionally deferred to a
  follow-up proposal.
- **A complete product information management system**: The schema is optimized
  for agent commerce, not full merchant PIM replacement.
- **Real-time inventory reservations**: Availability in a feed does not reserve
  inventory. Reservation semantics, if any, occur during checkout.
- **Order, payment, or fulfillment lifecycle changes**: These remain covered by
  existing ACP checkout and order specifications.
- **Delta cursors for consumers**: This proposal supports publisher-side
  incremental upserts. Consumer-facing change streams or cursor-based deltas are
  deferred.

---

## 3. Design

### 3.1 Feed Resource

A feed is a merchant- or seller-platform-managed product catalog resource. A
feed has server-managed metadata and a current product set.

Feed metadata contains:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Stable server-generated feed identifier. |
| `target_country` | string | No | ISO 3166-1 alpha-2 target market for the feed. |
| `updated_at` | string | No | RFC 3339 timestamp for the most recent update applied to the feed. |

Merchants MAY create multiple feeds for different markets, storefronts,
languages, sellers, or marketplace partitions. When multiple feeds are
available, agents SHOULD select the feed that best matches the buyer's market,
locale, and merchant context.

### 3.2 Product and Variant Model

The feed schema separates products from variants:

- `Product` groups one or more purchasable `Variant` records.
- `Variant` represents the purchasable unit an agent usually passes to checkout.
- Product-level fields describe the shared product concept.
- Variant-level fields describe the specific offer, option selection, price,
  availability, seller, and media.

Important fields include:

| Object | Field | Purpose |
|---|---|---|
| `Product` | `id` | Stable product grouping identifier. |
| `Product` | `title`, `description`, `url`, `media` | Merchant-provided display and navigation context. |
| `Product` | `variants` | Purchasable variants grouped under the product. |
| `Variant` | `id` | Stable variant identifier, preferred for checkout item selection when variants exist. |
| `Variant` | `title`, `description`, `url`, `media` | Variant-specific display context. |
| `Variant` | `price`, `list_price`, `unit_price` | Discovery-time price information. |
| `Variant` | `availability` | Purchasability and fulfillment state. |
| `Variant` | `categories`, `condition`, `variant_options` | Filtering and comparison signals. |
| `Variant` | `seller`, `marketplace` | Merchant-of-record and marketplace context. |

Variant IDs SHOULD be stable across feed updates. If a merchant uses different
identifiers for catalog variants and checkout items, the merchant MUST provide a
deterministic mapping outside this RFC or ensure the feed `Variant.id` is
accepted as an ACP checkout item ID.

### 3.3 Feed vs Checkout

| Aspect | Product Feed | Checkout Session |
|---|---|---|
| Purpose | Discovery and product selection | Purchase finalization |
| Timing | Before buyer commits to purchase | After buyer chooses items |
| Pricing | Informational, may be stale | Authoritative |
| Tax and fulfillment totals | Not authoritative | Authoritative |
| Inventory | Availability signal only | Validated by merchant |
| Payment | None | Required to complete purchase |
| Identifier use | Supplies product/variant IDs | Consumes item IDs |
| Failure handling | Agent refreshes or substitutes | Merchant returns checkout messages/errors |

Agents MUST treat checkout responses as authoritative even when they differ from
feed data. Merchants SHOULD include checkout messages when price, availability,
or policy constraints differ materially from the feed state the agent may have
seen.

### 3.4 Publication Models

This RFC supports two publication models.

#### Offline Full Replacement

The merchant publishes a complete feed snapshot:

- `metadata.json` contains the `FeedMetadata` shape.
- `products.jsonl` contains one `Product` object per line.

File ingestion replaces the full product set for the feed. Products omitted from
the next full snapshot are removed from the current feed. This model is suitable
for large catalogs and batch-oriented merchant systems.

#### API-Based Incremental Upserts

The merchant uses the Feed API to create metadata and partially upsert products:

| Operation | Method | Endpoint | Description |
|---|---|---|---|
| Create Feed | `POST` | `/feeds` | Create feed metadata. |
| Get Feed | `GET` | `/feeds/{id}` | Retrieve feed metadata. |
| Get Feed Products | `GET` | `/feeds/{id}/products` | Retrieve the current product set. |
| Upsert Feed Products | `PATCH` | `/feeds/{id}/products` | Create or update products by `Product.id`. |

`PATCH /feeds/{id}/products` is an upsert operation. Products omitted from the
request remain unchanged. For interoperability, merchants SHOULD send the
complete current `Product` object for each `Product.id` being upserted unless a
seller platform explicitly documents finer-grained merge semantics. Deleting
products through partial updates is deferred; merchants SHOULD either publish a
full replacement or mark variants as unavailable or discontinued when they
should no longer be purchased.

### 3.5 Discovery Integration

Sellers advertise product feed support through ACP discovery. A seller that
supports feeds SHOULD include `"feeds"` in `capabilities.services`:

```json
{
  "protocol": {
    "name": "acp",
    "version": "2026-01-30",
    "supported_versions": ["2026-01-30"]
  },
  "api_base_url": "https://merchant.example.com/api",
  "transports": ["rest"],
  "capabilities": {
    "services": ["checkout", "feeds"]
  }
}
```

The initial Feed API assumes an agent has a feed identifier from discovery,
merchant onboarding, a seller platform registry, or another trusted channel.
A follow-up discovery update SHOULD define a standard way to advertise available
feed descriptors, including feed ID, target country, locale, and product
endpoint. Until that descriptor exists, sellers and platforms SHOULD document
which feed IDs agents are expected to consume.

---

## 4. End-to-End Flow

### 4.1 Merchant Publishes a Feed

1. Merchant chooses feed scope, such as US catalog, UK catalog, or marketplace
   seller subset.
2. Merchant creates a feed:

```http
POST /feeds HTTP/1.1
API-Version: 2026-01-30
Idempotency-Key: idk_feed_create_123
Content-Type: application/json

{
  "target_country": "US"
}
```

3. Seller platform returns feed metadata:

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "feed_8f3K2x",
  "target_country": "US",
  "updated_at": "2026-03-01T00:00:00Z"
}
```

4. Merchant publishes an initial product set by either:
   - uploading `metadata.json` and `products.jsonl` as a full replacement, or
   - calling `PATCH /feeds/{id}/products` with product records.

Example partial upsert:

```http
PATCH /feeds/feed_8f3K2x/products HTTP/1.1
API-Version: 2026-01-30
Content-Type: application/json

{
  "products": [
    {
      "id": "prod_classic_tee",
      "title": "Classic Tee",
      "description": {
        "plain": "A classic cotton tee with a soft feel and relaxed fit."
      },
      "url": "https://merchant.example/products/classic-tee",
      "media": [
        {
          "type": "image",
          "url": "https://cdn.merchant.example/products/classic-tee/main.jpg",
          "alt_text": "Classic Tee front view"
        }
      ],
      "variants": [
        {
          "id": "sku124-red-m",
          "title": "Classic Tee - Red / Medium",
          "price": {
            "amount": 1999,
            "currency": "USD"
          },
          "availability": {
            "available": true,
            "status": "in_stock"
          },
          "variant_options": [
            { "name": "Color", "value": "Red" },
            { "name": "Size", "value": "Medium" }
          ]
        }
      ]
    }
  ]
}
```

5. Feed service updates the current product set and advances `updated_at`.
6. Seller advertises feed support in discovery and makes the feed ID available
   to authorized consuming agents or indexes.

### 4.2 Agent Discovers and Consumes the Feed

1. Agent starts with a seller domain, such as `merchant.example`.
2. Agent fetches `https://merchant.example/.well-known/acp.json`.
3. Agent verifies:
   - ACP is supported.
   - The agent's preferred API version is supported.
   - `capabilities.services` contains `"feeds"` and `"checkout"`.
4. Agent obtains the relevant feed ID from discovery, seller platform
   onboarding, registry metadata, or another trusted channel.
5. Agent retrieves feed metadata:

```http
GET /feeds/feed_8f3K2x HTTP/1.1
API-Version: 2026-01-30
```

6. Agent retrieves the current product set:

```http
GET /feeds/feed_8f3K2x/products HTTP/1.1
API-Version: 2026-01-30
```

7. Agent indexes the returned `Product[]` and stores freshness metadata such as
   `updated_at`, `ETag`, or `Last-Modified`.
8. When the buyer asks a product question, the agent searches the index and
   grounds recommendations in feed-provided product and variant data.

### 4.3 Agent Creates Checkout From Feed Data

1. Buyer chooses the red medium Classic Tee.
2. Agent refreshes or validates the selected variant if the cached feed state is
   stale.
3. Agent creates a checkout session using the checkout-compatible item ID:

```http
POST /checkout_sessions HTTP/1.1
API-Version: 2026-01-30
Idempotency-Key: idk_checkout_456
Content-Type: application/json

{
  "items": [
    {
      "id": "sku124-red-m",
      "quantity": 1
    }
  ]
}
```

4. Merchant returns authoritative checkout state.
5. If checkout returns a different price, unavailable item message, required
   buyer input, or fulfillment constraint, the agent presents that state to the
   buyer and follows the normal ACP checkout lifecycle.

### 4.4 Incremental Updates Propagate

1. Merchant inventory system marks `sku124-red-m` out of stock.
2. Merchant calls `PATCH /feeds/feed_8f3K2x/products` with the affected product
   and updated variant availability. For widest interoperability, the payload
   includes the complete current `Product` representation for
   `prod_classic_tee`:

```json
{
  "products": [
    {
      "id": "prod_classic_tee",
      "title": "Classic Tee",
      "description": {
        "plain": "A classic cotton tee with a soft feel and relaxed fit."
      },
      "url": "https://merchant.example/products/classic-tee",
      "media": [
        {
          "type": "image",
          "url": "https://cdn.merchant.example/products/classic-tee/main.jpg",
          "alt_text": "Classic Tee front view"
        }
      ],
      "variants": [
        {
          "id": "sku124-red-m",
          "title": "Classic Tee - Red / Medium",
          "price": {
            "amount": 1999,
            "currency": "USD"
          },
          "availability": {
            "available": false,
            "status": "out_of_stock"
          },
          "variant_options": [
            { "name": "Color", "value": "Red" },
            { "name": "Size", "value": "Medium" }
          ],
          "media": [
            {
              "type": "image",
              "url": "https://cdn.merchant.example/products/classic-tee/red-medium-1.jpg",
              "alt_text": "Classic Tee in red, size medium"
            }
          ],
          "seller": {
            "name": "Example Merchant"
          }
        }
      ]
    }
  ]
}
```

3. Feed service upserts the product by `Product.id` and advances `updated_at`.
4. Agent detects the changed `updated_at` or cache validator.
5. Agent refreshes `GET /feeds/{id}/products` and updates its index.
6. Future recommendations avoid the unavailable variant or explain that it is
   out of stock.
7. If the buyer had already selected the variant, the agent asks for a substitute
   before checkout or lets checkout return the authoritative failure message.

---

## 5. HTTP Interface

All endpoints follow ACP REST conventions:

- HTTPS required.
- JSON request and response bodies.
- Bearer authorization in the `Authorization` header required unless a seller
  explicitly publishes a public read-only feed.
- `API-Version` required.
- Mutating requests SHOULD use idempotency where supported.
- Errors use ACP's flat error shape:

```json
{
  "type": "invalid_request",
  "code": "feed_not_found",
  "message": "Feed not found",
  "param": "id"
}
```

### 5.1 Create Feed

`POST /feeds` creates feed metadata and returns `201 Created` with a
`FeedMetadata` object.

Request:

```json
{
  "target_country": "US"
}
```

Response:

```json
{
  "id": "feed_8f3K2x",
  "target_country": "US",
  "updated_at": "2026-03-01T00:00:00Z"
}
```

### 5.2 Get Feed

`GET /feeds/{id}` returns the feed metadata.

### 5.3 Get Feed Products

`GET /feeds/{id}/products` returns the full current product set:

```json
{
  "products": [
    {
      "id": "prod_classic_tee",
      "title": "Classic Tee",
      "variants": [
        {
          "id": "sku123-red-s",
          "title": "Classic Tee - Red / Small"
        }
      ]
    }
  ]
}
```

### 5.4 Upsert Feed Products

`PATCH /feeds/{id}/products` upserts products by `Product.id`. Products omitted
from the request remain unchanged. Merchants SHOULD submit complete current
product objects for each upserted product unless the seller platform documents
field-level merge behavior.

Response:

```json
{
  "id": "feed_8f3K2x",
  "accepted": true
}
```

---

## 6. Rationale

### 6.1 Why a Feed Instead of Search?

Search APIs embed ranking, personalization, query syntax, and business rules
that vary widely by merchant. Feeds are simpler and more interoperable: they let
agents build their own retrieval layer while merchants keep control over source
catalog data.

### 6.2 Why Product and Variant Separation?

Many commerce catalogs group several purchasable offers under one product page:
size, color, condition, seller, or bundle variants. Agents need product-level
context for explanation and variant-level context for checkout. Separating the
two avoids ambiguous item selection.

### 6.3 Why Full Snapshot Reads?

Full snapshot reads are easy for consumers to reason about and match existing
feed ingestion systems. Publisher-side incremental upserts reduce merchant
write cost without requiring a more complex consumer cursor protocol in the
first version.

### 6.4 Why Checkout Remains Authoritative?

Feed data can be cached, delayed, or scoped for discovery. Checkout has the
current buyer, address, selected fulfillment option, payment context, merchant
policy checks, and inventory validation. Keeping checkout authoritative avoids
making feeds responsible for transactional guarantees they cannot provide.

---

## 7. Security, Privacy, and Trust

- **No buyer data in feeds**: Product feeds MUST NOT contain buyer PII or
  session-specific data.
- **Management authorization**: Feed creation and product upserts MUST require
  merchant or seller-platform authorization.
- **Read authorization**: Sellers MAY publish public read-only feeds, but private
  or restricted feeds MUST require authorization.
- **Discovery enumeration**: Public discovery documents SHOULD avoid exposing
  private feed IDs or merchant-specific data that would create enumeration risk.
- **HTML and markdown safety**: Agents that render `description.html` or
  `description.markdown` MUST sanitize content before display.
- **Media safety**: Agents SHOULD proxy, cache, or otherwise handle media URLs in
  a way that avoids leaking unnecessary buyer context to third-party hosts.
- **Staleness handling**: Agents MUST NOT represent feed price or availability as
  guaranteed. Buyer-facing UI SHOULD make clear that checkout confirms final
  availability and totals.
- **Abuse controls**: Feed endpoints SHOULD support rate limiting, cache
  validators, and pagination or file-based transfer for large catalogs.

---

## 8. Backward Compatibility

Product feeds are additive:

- New endpoints under `/feeds` do not conflict with existing ACP endpoints.
- The `"feeds"` discovery service value can be introduced in an unreleased or
  future API version without changing existing service semantics.
- Existing checkout sessions, order APIs, delegate payment, and delegate
  authentication flows continue to work unchanged.
- Agents that do not consume feeds can continue to create checkout sessions
  using item identifiers obtained out-of-band.

---

## 9. Required Spec Updates

- [ ] `spec/unreleased/json-schema/schema.feed.json` - Define `FeedMetadata`,
  `CreateFeedRequest`, `Product`, `Variant`, product response, upsert request,
  and upsert response schemas.
- [ ] `spec/unreleased/openapi/openapi.feed.yaml` - Define `/feeds`,
  `/feeds/{id}`, and `/feeds/{id}/products` REST endpoints.
- [ ] `examples/unreleased/examples.feed.json` - Add feed creation, product
  retrieval, product upsert, and error examples.
- [ ] `changelog/unreleased/add-feed-api.md` - Document the new feed API
  surface.
- [ ] `spec/unreleased/json-schema/schema.agentic_checkout.json` - Add `"feeds"`
  to discovery `capabilities.services`.
- [ ] `rfcs/rfc.discovery.md` - Document the `"feeds"` service value and any
  future feed descriptor fields.

---

## 10. Conformance Checklist

**MUST requirements:**

- [ ] Feed management implementations MUST create feed metadata with stable feed
  IDs.
- [ ] `GET /feeds/{id}` MUST return the current `FeedMetadata` or `404` if the
  feed does not exist.
- [ ] `GET /feeds/{id}/products` MUST return the full current product set.
- [ ] `PATCH /feeds/{id}/products` MUST upsert products by `Product.id`.
- [ ] Product records MUST include stable `Product.id` values.
- [ ] Product records MUST include `variants`.
- [ ] Variant records MUST include stable `Variant.id` and `title` values.
- [ ] Agents MUST treat checkout responses as authoritative over feed data.

**SHOULD requirements:**

- [ ] Sellers SHOULD advertise feed support with `"feeds"` in discovery
  `capabilities.services`.
- [ ] Sellers SHOULD make feed IDs discoverable through a trusted channel.
- [ ] Sellers SHOULD update `updated_at` after successful full replacements or
  product upserts.
- [ ] Sellers SHOULD include `ETag` or `Last-Modified` validators for large feed
  responses.
- [ ] Sellers SHOULD keep variant IDs stable across updates.
- [ ] Agents SHOULD refresh stale feed data before creating checkout sessions.
- [ ] Agents SHOULD sanitize rich descriptions before rendering.

**MAY requirements:**

- [ ] Sellers MAY publish multiple feeds for different target countries,
  storefronts, sellers, or locales.
- [ ] Sellers MAY publish public read-only feeds.
- [ ] Sellers MAY require authorization for feed reads.
- [ ] Sellers MAY use full replacement file ingestion for large catalogs.
- [ ] Sellers MAY use `PATCH /feeds/{id}/products` for small incremental
  updates.
