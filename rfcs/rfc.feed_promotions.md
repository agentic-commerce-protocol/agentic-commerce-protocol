# RFC: Agentic Commerce - Feed Promotions

**Status:** Draft
**Version:** unreleased
**Scope:** Merchant-managed promotions for products published through the Feed API

This RFC defines feed-level promotions for the Agentic Commerce Protocol (ACP).
Promotions let merchants publish structured promotional metadata for products and
variants that they have already published in a product feed. The Feed Promotions
API is a merchant-to-agent API: merchants call the agent or platform feed
ingestion service to create, update, and inspect promotions. Agents do not call
these promotion endpoints on merchants.

---

## 1. Motivation

Product feeds give agents structured product and variant data for discovery,
recommendation, and shopping flows. Merchants also need a way to tell agents
which of those feed items are currently promoted, scheduled for promotion, or no
longer eligible for a promotion.

Without feed-level promotions, merchants have poor choices:

- **Encode promotions in product text**: Agents must infer promotion semantics
  from titles, descriptions, or landing pages, which is brittle and hard to keep
  current.
- **Wait until checkout**: The buyer may not learn about a promotion until after
  product discovery and cart building, missing opportunities to rank, compare,
  and explain relevant offers earlier.
- **Rely on out-of-band sync**: Merchant and agent systems can disagree about
  whether a promotion exists, what it applies to, or when it is active.

Feed Promotions gives merchants a direct, structured way to publish promotions
against the same product and variant identifiers already used in the feed. It
also gives merchants a read path to retrieve the latest promotion state as the
agent understands it after ingestion and validation.

### What Feed Promotions provides

- **Merchant-managed promotion publishing**: Merchants can create or update
  promotions by stable `Promotion.id`.
- **Product and variant targeting**: Promotions can target products or specific
  variants already present in the feed.
- **Structured benefits**: Promotions can describe amount-off, percent-off, and
  free-shipping benefits without requiring agents to scrape merchant pages.
- **Lifecycle visibility**: Promotions can include a status and effective time
  range so agents can reason about draft, scheduled, active, expired, and
  disabled offers.
- **Agent-state reconciliation**: Merchants can retrieve the full promotion set
  the agent currently has for a feed.

---

## 2. Direction of Calls

The Feed Promotions API is hosted by the agent or platform feed ingestion
service. The merchant is the client.

```text
Merchant promotion system --PATCH /feeds/{id}/promotions--> Agent feed API
Merchant promotion system <--200 accepted------------------- Agent feed API

Merchant promotion system --GET /feeds/{id}/promotions----> Agent feed API
Merchant promotion system <--current promotions------------- Agent feed API
```

This direction is part of the design. The agent does not call
`GET /feeds/{id}/promotions` or `PATCH /feeds/{id}/promotions` on the merchant.
Agents use the promotion state they have ingested for product discovery,
ranking, explanation, and downstream shopping experiences.

---

## 3. Goals and Non-Goals

### 3.1 Goals

1. **Structured promotion sync**: Define a standard way for merchants to publish
   promotions for feed products.
2. **Partial upsert semantics**: Let merchants create or update a subset of
   promotions without resending the full promotion set.
3. **Read-back state**: Let merchants retrieve the current promotion set as
   understood by the agent.
4. **Feed alignment**: Tie promotions to product and variant identifiers already
   published under the same feed.
5. **Benefit extensibility**: Support common promotion benefits now while
   allowing future benefit shapes to be added.

### 3.2 Non-Goals

- **Agent-to-merchant promotion retrieval**: Agents do not call these endpoints
  on merchant systems.
- **Checkout discount code submission**: Buyer-entered discount codes and
  applied checkout discounts are handled by checkout and discount extension
  flows, not this API.
- **Promotion redemption accounting**: This RFC does not define redemption
  limits, usage counters, budget tracking, or fraud controls.
- **Full promotion replacement or deletion**: The API defines partial upserts.
  Promotions omitted from an upsert remain unchanged. Merchants can disable or
  expire promotions by updating `status` or `effective_period`.
- **Authoritative checkout pricing**: Promotions in the feed help agents
  discover and explain offers. Final pricing remains a checkout concern.

---

## 4. Design

### 4.1 Scope

Promotions are scoped to a single feed. A promotion submitted to
`/feeds/{id}/promotions` applies only to the feed identified by `{id}`.

Promotion targets refer to product and variant identifiers in that same feed:

- `ProductTarget.product_id` identifies a published product.
- `ProductTarget.variant_ids` optionally narrows the promotion to specific
  variants. When omitted, the promotion applies to all variants of the product.

Merchants SHOULD only target products and variants that have been published to
the same feed. Agents SHOULD reject invalid promotion payloads when targets
cannot be interpreted.

### 4.2 Lifecycle

```text
Merchant publishes products
        |
        v
Merchant upserts promotions for those products
        |
        v
Agent validates and stores the promotion set
        |
        v
Merchant reads current promotion state when reconciliation is needed
        |
        v
Agent uses ingested promotion state in discovery and shopping flows
```

`PATCH /feeds/{id}/promotions` returns an acknowledgement that the submitted
payload was accepted for processing. Merchants that need the latest effective
state SHOULD call `GET /feeds/{id}/promotions` after upsert processing.

### 4.3 Promotion vs Checkout Discount

| Aspect | Feed Promotion | Checkout Discount |
|---|---|---|
| Purpose | Communicate offers during product discovery | Apply pricing during checkout |
| Call direction | Merchant to agent | Agent to merchant checkout API |
| Scope | Feed products and variants | Checkout session line items and totals |
| Timing | Before shopping or checkout | During checkout session creation/update |
| Pricing authority | Informational for discovery | Authoritative in checkout response |

Feed Promotions can describe offers that later affect checkout, but this RFC
does not require a one-to-one mapping between a feed promotion and an applied
checkout discount.

---

## 5. Schema

### 5.1 Promotion

A `Promotion` describes one merchant-defined offer associated with a feed.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Stable global identifier for this promotion. |
| `title` | string | Yes | Display title for the promotion. |
| `description` | `Description` | No | Structured description content for the promotion. |
| `status` | `PromotionStatus` | No | Extensible lifecycle state. Known values include `draft`, `scheduled`, `active`, `expired`, and `disabled`. |
| `effective_period` | `DateTimeRange` | Yes | Time range during which the promotion should apply. |
| `benefits` | `PromotionBenefit[]` | Yes | One or more benefits granted by the promotion. |
| `applies_to` | `ProductTarget[]` | No | Product or variant targets to which the promotion applies. |
| `url` | string (URI) | No | Canonical URL for the promotion detail or landing page. |

### 5.2 DateTimeRange

| Field | Type | Required | Description |
|---|---|---|---|
| `start_time` | string (date-time) | Yes | RFC 3339 timestamp when the promotion becomes active. |
| `end_time` | string (date-time) | Yes | RFC 3339 timestamp when the promotion stops being active. |

### 5.3 PromotionBenefit

`PromotionBenefit` is a union of supported benefit shapes.

| Benefit | Type discriminator | Required fields | Description |
|---|---|---|---|
| Amount off | `amount_off` | `amount_off` | Fixed monetary amount discounted from the applicable item or order. |
| Percent off | `percent_off` | `percent_off` | Percentage discount applied by the promotion. |
| Free shipping | `free_shipping` | None beyond `type` | Shipping cost waived for eligible purchases. |

Example amount-off benefit:

```json
{
  "type": "amount_off",
  "amount_off": {
    "amount": 1000,
    "currency": "USD"
  }
}
```

Example percent-off benefit:

```json
{
  "type": "percent_off",
  "percent_off": 20
}
```

Example free-shipping benefit:

```json
{
  "type": "free_shipping"
}
```

### 5.4 ProductTarget

| Field | Type | Required | Description |
|---|---|---|---|
| `product_id` | string | Yes | Identifier of the product targeted by the promotion. |
| `variant_ids` | string[] | No | Optional subset of variant identifiers targeted by the promotion. When omitted, the promotion applies to all variants of the product. |

Example:

```json
{
  "product_id": "prod_classic_tee",
  "variant_ids": ["sku123-red-s"]
}
```

---

## 6. HTTP Interface

### 6.1 Operations

| Operation | Method | Endpoint | Description |
|---|---|---|---|
| Get Feed Promotions | `GET` | `/feeds/{id}/promotions` | Retrieve the full current promotion set for a feed as understood by the agent. |
| Upsert Feed Promotions | `PATCH` | `/feeds/{id}/promotions` | Create or update promotions by `Promotion.id`; omitted promotions remain unchanged. |

All endpoints follow ACP's existing HTTP conventions:

- HTTPS required, JSON request and response bodies.
- `Authorization: Bearer <token>` required.
- `API-Version` header required.

### 6.2 Get Feed Promotions

`GET /feeds/{id}/promotions`

Returns the full current promotion set for the specified feed as understood by
the agent.

Response: `200 OK` with `PromotionsResponse`.

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "promotions": [
    {
      "id": "promo_spring_sale",
      "title": "Spring Sale",
      "status": "active",
      "effective_period": {
        "start_time": "2026-03-01T00:00:00Z",
        "end_time": "2026-03-31T23:59:59Z"
      },
      "benefits": [
        {
          "type": "percent_off",
          "percent_off": 20
        }
      ],
      "applies_to": [
        {
          "product_id": "prod_classic_tee"
        }
      ]
    }
  ]
}
```

Returns `404 Not Found` if the feed does not exist.

### 6.3 Upsert Feed Promotions

`PATCH /feeds/{id}/promotions`

Partially upserts promotions into the specified feed by `Promotion.id`.
Promotions omitted from the request remain unchanged.

Request:

| Field | Type | Required | Description |
|---|---|---|---|
| `promotions` | `Promotion[]` | Yes | Subset of promotions to create or update within the feed. |

Response: `200 OK` with `UpsertPromotionsResponse`.

Example request:

```json
PATCH /feeds/feed_8f3K2x/promotions HTTP/1.1
Authorization: Bearer <token>
API-Version: 2026-01-30
Content-Type: application/json

{
  "promotions": [
    {
      "id": "promo_spring_sale",
      "title": "Spring Sale",
      "status": "active",
      "effective_period": {
        "start_time": "2026-03-01T00:00:00Z",
        "end_time": "2026-03-31T23:59:59Z"
      },
      "benefits": [
        {
          "type": "percent_off",
          "percent_off": 20
        }
      ],
      "applies_to": [
        {
          "product_id": "prod_classic_tee"
        }
      ]
    }
  ]
}
```

Example response:

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "feed_8f3K2x",
  "accepted": true
}
```

Invalid promotion payloads return `400 Bad Request` with
`code: invalid_promotion_payload`. Requests for unknown feeds return
`404 Not Found` with `code: feed_not_found`.

### 6.4 Partial Upsert Semantics

The `PATCH` operation matches submitted promotions by `Promotion.id`.

- If the `Promotion.id` is new to the feed, the agent creates that promotion.
- If the `Promotion.id` already exists, the agent updates that promotion.
- Promotions omitted from the request remain unchanged.
- To stop a promotion, the merchant SHOULD update it with `status: disabled` or
  an `effective_period` whose `end_time` has passed.

This avoids requiring merchants to send the full promotion catalog for small
changes while preserving a read path for reconciliation through
`GET /feeds/{id}/promotions`.

---

## 7. Backward Compatibility

This is a purely additive change:

- **New endpoints**: `/feeds/{id}/promotions` is a new Feed API subresource.
- **New schemas**: Promotion schemas are added to the feed schema surface.
- **No changes to checkout**: Checkout session creation, update, completion,
  payment, and order flows are unchanged.
- **No requirement for agents to call merchant promotion APIs**: The endpoint
  direction is merchant to agent, so existing merchant ACP checkout endpoints do
  not need to expose these paths.

Merchants and agents that do not use Feed Promotions continue to interoperate
through existing feed, checkout, and order flows.

---

## 8. Required Spec Updates

- [ ] `spec/unreleased/openapi/openapi.feed.yaml` - Add
  `GET /feeds/{id}/promotions` and `PATCH /feeds/{id}/promotions`.
- [ ] `spec/unreleased/json-schema/schema.feed.json` - Add `DateTimeRange`,
  `PromotionStatus`, `AmountOffBenefit`, `PercentOffBenefit`,
  `FreeShippingBenefit`, `PromotionBenefit`, `ProductTarget`, `Promotion`,
  `PromotionsResponse`, `UpsertPromotionsRequest`, and
  `UpsertPromotionsResponse`.
- [ ] `examples/unreleased/examples.feed.json` - Add examples for promotion
  retrieval, promotion upsert requests, and invalid promotion payload errors.
- [ ] `changelog/unreleased/add-feed-promotions.md` - Add the changelog entry.

---

## 9. Conformance Checklist

**MUST requirements:**

- [ ] MUST expose `GET /feeds/{id}/promotions` on the agent or platform feed
  ingestion service, not on the merchant's checkout API.
- [ ] MUST expose `PATCH /feeds/{id}/promotions` on the agent or platform feed
  ingestion service, not on the merchant's checkout API.
- [ ] MUST match upserted promotions by `Promotion.id`.
- [ ] MUST leave omitted promotions unchanged during partial upsert.
- [ ] MUST return `promotions` in every successful `PromotionsResponse`.
- [ ] MUST return `id` and `accepted` in every successful
  `UpsertPromotionsResponse`.

**SHOULD requirements:**

- [ ] SHOULD validate that `applies_to` targets refer to products or variants in
  the same feed.
- [ ] SHOULD support amount-off, percent-off, and free-shipping benefit shapes.
- [ ] SHOULD support the known status values `draft`, `scheduled`, `active`,
  `expired`, and `disabled`.
- [ ] SHOULD use `GET /feeds/{id}/promotions` as the reconciliation mechanism
  for merchant systems that need the agent's latest promotion state.

**MAY requirements:**

- [ ] MAY accept promotion targets before the corresponding product update has
  finished processing, if the implementation can reconcile them later.
- [ ] MAY add future promotion benefit shapes without changing the existing
  benefit discriminators.
