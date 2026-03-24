# Feed Promotions

**Added** – unreleased promotion support for the Feed API surface.

## New API Surface

- `GET /feeds/{id}/promotions` to retrieve the current promotion set
- `PATCH /feeds/{id}/promotions` to partially upsert promotions by `Promotion.id`

## New Schemas

- `DateTimeRange`
- `PromotionStatus`
- `AmountOffBenefit`
- `PercentOffBenefit`
- `FreeShippingBenefit`
- `PromotionBenefit`
- `ProductTarget`
- `Promotion`
- `PromotionsResponse`
- `UpsertPromotionsRequest`
- `UpsertPromotionsResponse`
