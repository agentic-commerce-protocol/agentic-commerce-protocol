# RFC: Sale Extension

**Status:** Draft
**Version:** 2026-02-09
**Scope:** Sale pricing context with compare-at prices, sale windows, and EU Omnibus compliance
**Depends on:** RFC: ACP Extensions Framework

This RFC defines the **Sale Extension**, which enriches checkout sessions and
line items with sale pricing context. It introduces a session-level `sales[]`
registry containing campaign metadata and a per-item `sale` object carrying
compare-at pricing and EU Omnibus compliance fields. The extension is
response-only, optional, and backward-compatible. A companion amendment to the
Discount Extension is proposed to complete the sale-discount interaction story.

---

## 1. Scope & Goals

- Provide a **session-level sale registry** with campaign metadata (name,
  description, temporal window)
- Enable **per-item compare-at pricing** for rich price communication ("was $75,
  now $50")
- Support **EU Omnibus Directive** lowest-recent-price fields
  (`lowest_recent_amount`, `lowest_recent_period_days`)
- Clarify **sale-discount interaction** via a discount eligibility signal on line
  items
- Establish the **normalized model** pattern: session-level entity with per-item
  references

**Out of scope:** Conditional checkout offers and cart incentives (separate SEP),
sale creation or management APIs, price history storage or calculation APIs,
dynamic or personalized pricing, catalog or product feed enrichment.

---

## 2. Motivation

### 2.1 The Experience Merchants Build and Buyers Expect

Sale campaigns are a cornerstone of e-commerce. Merchants invest heavily in
crafting them — naming them, setting windows, choosing which items to include,
deciding compare-at pricing — because the presentation of a deal matters as much
as the deal itself. Buyers shopping online routinely see the original price, the
reduced price, the sale name, and how long the deal lasts. That context drives
trust, urgency, and conversion.

When an agent mediates the checkout, it becomes the buyer's interface. An agent
that can say "Wireless Headphones — $50 (was $75, 33% off, Winter Sale ends
Feb 14)" delivers the same experience the merchant designed. An agent limited to
"Wireless Headphones — $50" strips that context away.

Today, ACP's checkout response carries `unit_amount` — the price itself — but
not the context around it: what the item normally costs, that it is on sale, or
when the sale ends. This extension brings that context into the checkout response
so that any agent can deliver the rich pricing experience merchants already
design for their storefronts.

### 2.2 What This Extension Adds

**For merchants:**

1. **Sale campaign visibility** — merchants name their sales, write
   descriptions, and set urgency windows. This extension gives those campaigns a
   structured representation that agents can faithfully relay to buyers,
   preserving the merchant's voice.
2. **Discount policy clarity** — merchants frequently exclude sale items from
   additional discount codes. A per-item eligibility signal lets agents
   communicate this upfront rather than discovering it through trial-and-error.
3. **Conversion tools** — "sale ends tonight" and "lowest price in 30 days" are
   proven conversion drivers. Structured fields enable agents to deliver these
   signals at the moment of purchase.

**For agents:**

4. **Richer price communication** — agents can narrate pricing context ("was $75,
   now $50, 33% off") instead of presenting a bare number.
5. **Smarter discount handling** — knowing which items accept discount codes
   before attempting them avoids failed applications and confusing partial
   discounts.
6. **Real-time authority** — the checkout response is the authoritative price at
   the moment of transaction. When sale context lives here, agents can confirm
   pricing in real time rather than relying on catalog data that may have
   changed.

**For buyers:**

7. **Transparency** — buyers see what they would see on any storefront: the
   regular price, the sale price, and why it changed.
8. **Informed decisions** — sale windows and price history help buyers decide
   whether to buy now or wait.

### 2.3 Why a Sale Is Not a Discount

A natural question is whether sale pricing can be modeled as a special case of
the existing Discount Extension. It cannot — they are fundamentally different
concepts that every e-commerce platform models separately:

| Aspect | Sale | Discount |
|--------|------|----------|
| **What changes** | The item's base price itself. `unit_amount` is already the sale price. | A reduction applied _on top of_ the current price. |
| **Who decides** | The merchant, as a catalog-level decision made before any checkout session exists. | The buyer (by entering a code) or the merchant (automatic), at checkout time. |
| **Lifecycle** | Campaign-scoped: has a name, description, start/end window. Exists independently of any checkout session. | Session-scoped: applied to a specific cart, may have per-use limits. |
| **Presentation** | "Was $75, now $50" — compare-at price with optional sale branding. | "$50 minus $10 coupon = $40" — a line-item deduction. |
| **Stacking** | Sale price is the starting point. Discounts stack on top of it. | Discounts compose with each other and with the sale price. |
| **Platform modeling** | Separate fields: Shopify `compare_at_price`, WooCommerce `regular_price`. | Separate system: coupon codes, cart rules, discount allocations. |

Collapsing sales into discounts would lose the merchant's campaign context,
conflate the "was" price with the "before coupon" price, and make it impossible
to express the common policy of excluding sale items from additional discount
codes. The two concepts compose — a $75 item on sale for $50, with a $10 coupon,
is $40 — but they are not the same thing.

ACP currently has two other mechanisms for expressing price reductions:
`DiscountDetail` on `LineItem.discount_details[]` (base schema) and
`AppliedDiscount` on `CheckoutSession.discounts.applied[]` (Discount Extension).
Neither models sale pricing. `AppliedDiscount` with `automatic: true` — the
closest contender — carries a mechanical difference: with a sale, `unit_amount`
IS the reduced price; with an automatic discount, the reduction is applied on top
of `unit_amount`. Beyond this, `AppliedDiscount` lacks compare-at pricing,
campaign identity, and EU Omnibus fields. Automatic discounts are a legitimate
concept — checkout-time, condition-based reductions like "free shipping over $50"
— but they are not catalog price changes. `DiscountDetail` is an under-specified
legacy type with no RFC documentation; see [issue #124](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/124) for proposed clarification.

### 2.4 Checkout as the Authoritative Pricing Surface

Sale pricing is a catalog concept — the merchant set the price before any
checkout session existed. Product feed specs already carry this data: the OpenAI
product feed has `sale_price`, `sale_price_effective_date`, and `pricing_trend`;
Google Merchant Center has `salePrice` and `salePriceEffectiveDate`; Meta
Commerce has equivalent fields. The OpenAI product feed — the most recent and
most AI-agent-focused commerce spec — includes sale pricing as first-class,
recognizing it as essential context for agent-mediated commerce. A fair question:
is the Sale Extension forcing a catalog concern into a checkout protocol?

No. The Sale Extension does not replicate the catalog. It carries pricing context
at the moment of transaction: the answer to one question agents cannot answer
from the checkout response alone — is `unit_amount` the regular price or a
reduced one? Campaign metadata (name, window) provides supporting context for
that answer, not catalog data for discovery.

Feed specs and checkout serve different lifecycle stages. A feed says "this item
will go on sale Feb 1–14." The checkout response says "this item IS on sale right
now, was $75, now $50." Between feed ingestion and checkout, the sale could have
ended or the compare-at amount could have changed. The checkout is the moment of
truth — the same reason storefronts re-confirm sale prices at checkout even
though the product page already showed them.

As an agent-agnostic protocol, ACP cannot depend on any specific feed spec. Not
all agents use the OpenAI feed — some use Google, Meta, proprietary catalogs, or
discover products through conversations and links. The checkout response is the
one universal surface every agent receives. If sale context only lives in feeds,
agents without feed access are blind to it at the moment that matters most.

No feed spec includes EU Omnibus `lowest_recent_amount`, per-item
`discount_eligible` signals, or a normalized campaign registry with
presentation-priority ordering. These are checkout-time concerns that complement
feed-level sale data rather than duplicating it. The Sale Extension ensures the
checkout response is at least as rich as the feed that led the agent there.

### 2.5 Cross-Platform Consensus

Compare-at pricing is a universal concept across e-commerce platforms:

| Platform | Compare-At Field | Sale Window | Reference |
|----------|-----------------|-------------|-----------|
| Shopify | `compare_at_price` | No native | [Product Variant API](https://shopify.dev/docs/api/admin-rest/latest/resources/product-variant) |
| WooCommerce | `regular_price` | `date_on_sale_from/to` | [REST API docs](https://woocommerce.github.io/woocommerce-rest-api-docs/) |
| BigCommerce | `retail_price` | No native | [Catalog Products API](https://developer.bigcommerce.com/docs/rest-catalog/products) |
| Amazon | "Was" / Typical Price | Deal timer (UI) | [Product Pricing API](https://developer-docs.amazon.com/sp-api/docs/product-pricing-api) |
| Adobe Commerce | `price` (base) | `special_from/to_date` | [Catalog Pricing API](https://developer.adobe.com/commerce/webapi/rest/modules/catalog/catalog-pricing/) |

Every major e-commerce platform provides compare-at pricing. Neither ACP nor UCP
currently carries this concept in their checkout responses. This extension brings
ACP in line with what every platform models internally.

### 2.6 EU Omnibus Directive

The EU Omnibus Directive (2019/2161) requires displaying the lowest price in the
prior 30 days when announcing a price reduction. This regulation is actively
enforced with significant fines:

| Target | Country | Fine | Year | Violation |
|--------|---------|------|------|-----------|
| Shein | France | **EUR 40M** | Jul 2025 | Systematic price inflation before "reductions" |
| Zalando | Poland | **EUR 7.1M** | Jan 2026 | Discounts calculated against initial prices, not 30-day lowest |
| Temu | Poland | **EUR 1.35M** | Jan 2026 | Inconsistent 30-day lowest display across variants and cart |
| 5 Dutch retailers | Netherlands | **EUR 621K** | 2024 | Misleading "was/now" prices not based on 30-day lowest |

The ECJ ruling C-330/23 (September 2024, Aldi Sud) established binding
precedent across all EU member states: percentage discounts MUST be calculated
from the 30-day lowest price. No major e-commerce platform has native support for
this — all rely on third-party plugins (Shopify: "Omnibus Pricing" apps;
WooCommerce: "Omnibus" plugins; BigCommerce: external SaaS services).

The `lowest_recent_amount` and `lowest_recent_period_days` fields in this
extension give merchants a structured way to surface this data through ACP,
helping agents communicate compliant pricing information to EU buyers.

---

## 3. Extension Declaration

Merchants advertise sale support via `capabilities.extensions` in checkout
responses:

```json
{
  "capabilities": {
    "payment_methods": ["card"],
    "extensions": [
      {
        "name": "sale",
        "extends": [
          "$.CheckoutSession.sales",
          "$.LineItem.sale"
        ]
      }
    ]
  }
}
```

The `extends` field uses JSONPath expressions to identify the exact fields added:

| JSONPath | Description |
|----------|-------------|
| `$.CheckoutSession.sales` | Adds `sales[]` registry to the checkout session response |
| `$.LineItem.sale` | Adds `sale` object to line items in responses |

Both paths are response-only. The agent does not submit sale data — the merchant
is the system of record for pricing.

Merchants **MAY** also include the optional `schema` field with a URL to the
JSON Schema defining the sale objects. For core ACP extensions, this is optional
since the schema is defined in the specification. For third-party extensions,
providing a schema URL is recommended.

---

## 4. Schema

When this extension is active, checkout responses are extended with a
session-level `sales[]` array and per-item `sale` objects on line items. All
monetary fields inherit the session's `currency`.

### 4.1 Sale Object (session-level)

The sale entity in `$.CheckoutSession.sales[]`. Describes the sale campaign
itself — shared metadata across all items in that sale.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Stable, opaque identifier for the sale (e.g., `sale_winter2026`). Referenced by `sale.id` on line items. MUST be consistent across sessions. |
| `name` | string | No | Human-readable sale label (e.g., "Winter Sale", "Black Friday Doorbuster"). |
| `description` | string | No | Richer context about the sale. Agents MAY use this to contextualize the sale for the buyer. |
| `start` | string (RFC 3339) | No | When the sale became effective. |
| `end` | string (RFC 3339) | No | When the sale expires. |
| `metadata` | object | No | Arbitrary key-value pairs. Values MUST be strings. No nested objects or arrays. |

**Array ordering:** The order of entries in `sales[]` indicates presentation
priority — the first entry is the most prominent or urgent. Agents SHOULD use
this ordering when summarizing active sales. Merchants SHOULD place the most
time-sensitive or highest-value sale first.

### 4.2 Line Item Sale (per-item)

The `sale` object on `$.LineItem`. Per-item pricing context that references a
session-level `Sale` by `id` and carries item-specific fields.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | References a `Sale` entry in `$.CheckoutSession.sales[]`. Links this item to its sale campaign. |
| `compare_at_amount` | integer | Yes | The regular / "was" price for this item, in minor currency units. This is the field that justifies the `sale` object's existence — it answers whether `unit_amount` is a regular price or a reduced one. |
| `lowest_recent_amount` | integer | No | Lowest price for this item in the recent period, in minor currency units. Supports EU Omnibus compliance. |
| `lowest_recent_period_days` | integer | No | Number of days covered by `lowest_recent_amount`. Default: 30. Merchants MAY use any lookback window (e.g., 365 for "lowest price this year"). |

### 4.3 Normalized Model

Sale data is split across two levels to avoid redundancy and ensure consistency:

- **Session-level `sales[]`** — the sale entity with shared metadata (name,
  description, window). A field like `description` would be absurd to repeat per
  item but is valuable at the sale level.
- **Line-item `sale`** — per-item pricing context. `compare_at_amount` varies
  per item (headphones were $150, shoes were $100). References the session-level
  sale by `id`.

**One sale per item:** Each line item references exactly one sale via `sale.id`
(a string, not an array). Every platform models one active sale price per item
(Shopify: one `compare_at_price` per variant; WooCommerce: one `sale_price` per
product). If multiple promotions overlap, the merchant resolves the overlap
before responding — the result is a single reduced `unit_amount` with a single
`sale` reference. Multiple simultaneous discounts ON TOP of a sale price are
handled by the Discount Extension.

---

## 5. Invariants

### 5.1 Schema-Enforceable

The following constraints can be expressed in JSON Schema Draft 2020-12:

- `Sale.id` is REQUIRED in session-level `sales[]` entries.
- `sale.id` and `sale.compare_at_amount` are REQUIRED on line-item `sale`
  objects.
- `compare_at_amount` MUST be a positive integer (greater than 0).
- When `lowest_recent_amount` is present, `lowest_recent_period_days` SHOULD
  also be present (expressible via `dependentRequired`).
- `metadata` values MUST be strings.

### 5.2 Runtime-Only (Normative Prose)

The following constraints are normative but cannot be fully expressed in JSON
Schema. Implementations MUST enforce them:

- `sale.id` on a line item MUST reference an existing entry in
  `$.CheckoutSession.sales[]` (referential integrity).
- `compare_at_amount` MUST be strictly greater than the line item's
  `unit_amount`. A "was" price equal to or less than the current price is
  nonsensical.
- `lowest_recent_amount` MUST be less than or equal to `compare_at_amount`. The
  lowest recent price cannot exceed the regular price.
- `lowest_recent_amount` MUST reflect the actual lowest price in the stated
  period. Compliance with EU Omnibus or other regulations is the merchant's
  responsibility. The protocol provides the fields; the merchant provides
  accurate data.
- `end` SHOULD be in the future or omitted. Merchants MUST NOT return stale sale
  data for expired sales.
- The `sale` object on a line item MUST only be present when the item has an
  active sale. Absence of `sale` on a line item implies regular price.
- Every `Sale` in `sales[]` SHOULD be referenced by at least one line item. No
  orphan sales — if no remaining items reference a sale, the entry SHOULD be
  removed from `sales[]`.
- `sales[]` array ordering indicates presentation priority. The first entry is
  the most prominent or urgent.
- Extension fields MUST be omitted (not set to `null`) when not applicable.

---

## 6. Operations

### 6.1 Response-Only Model

All sale fields are **response-only**. The merchant is the system of record for
pricing — the agent does not tell the merchant what the sale price is. There are
no request-side fields for the sale extension. This differs from the Discount
Extension, which accepts `discounts.codes` in requests.

### 6.2 Authoritative Cart State

Sale context follows ACP's "authoritative cart state on every response" model.
The latest checkout response is always the source of truth. There is no delta
or event model — the full sale state is included in every response.

### 6.3 Sale Lifecycle

If a sale ends between requests (e.g., between session create and session
update), the merchant returns updated data:

1. The `sale` object is removed from affected line items.
2. The `Sale` entry is removed from `sales[]` if no remaining items reference it.
3. `unit_amount` reverts to the regular price.

No special handling is required beyond what ACP already provides. The `sale.end`
field makes the temporal dimension explicit, but the authoritative-response model
means agents always receive the current state regardless of whether they track
expiration times.

### 6.4 Impact on Totals

Sale pricing is reflected in `unit_amount`, which is already part of the core
checkout schema. The `sale` extension does not introduce new total types. The
`compare_at_amount` field is contextual metadata — it explains the price but does
not change how totals are calculated.

### 6.5 Boundary with Discounts

A sale and a discount are different operations on a price:

- A **sale** changes the base price itself. The line item's `unit_amount` already
  reflects the sale price. The `sale` object provides context (what it used to
  cost, why it changed, when it expires) but does not represent an active
  reduction.
- A **discount** is a reduction applied on top of the current `unit_amount`. It
  appears in the Discount Extension's `discounts.applied[]` and/or the base
  schema's `discount_details[]`.

Consequently:

- The sale reduction (the difference between `compare_at_amount` and
  `unit_amount`) MUST NOT appear in `discounts.applied[]`,
  `discount_details[]`, or any totals entry. It is not a discount — it is the
  price.
- `discounts.applied[]` and `discount_details[]` MUST only contain reductions
  applied on top of `unit_amount`.
- Agents computing total savings SHOULD treat `compare_at_amount - unit_amount`
  as the sale savings and any discount amounts as separate, additive savings.
  These MUST NOT be conflated.

This distinction is consistent with how every major e-commerce platform models
the relationship: Shopify's `compare_at_price` is a display field on the
variant, entirely separate from its discount and cart rules systems.

> **Note:** The base schema's `DiscountDetail` type on `LineItem.discount_details[]`
> predates the Discount Extension and has limited documentation around its
> `source: "automatic"` value. See [issue #124](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/124) for a proposal to clarify the
> relationship between `DiscountDetail`, `AppliedDiscount`, and sale pricing.

---

## 7. Sale-Discount Interaction

Sale pricing and discounts are semantically distinct concepts that compose
naturally. Understanding their interaction is important for both merchants and
agents.

### 7.1 Composition Model

```
Base price:    $75  (compare_at_amount — what the item normally costs)
Sale price:    $50  (unit_amount — the current price, with sale context)
Discount:     -$10  (from Discount Extension, IF discount_eligible)
Final:         $40  (reflected in line item totals)
```

The sale price is the starting point for any further discount calculations. The
Discount Extension operates on `unit_amount`, not on `compare_at_amount`.

### 7.2 Three Scenarios

**Scenario 1: Full exclusion** — All cart items are on sale and excluded from
discount codes. The merchant rejects the code entirely.

```
Cart: [Headphones ($50, was $75), Speaker ($80, was $120)]
Agent applies: SAVE10
Result: Rejected — "discount_code_sale_item_excluded"
```

Without this extension, the merchant must misuse
`discount_code_combination_disallowed` or fall back to the generic
`discount_code_invalid`. Neither accurately describes the situation.

**Scenario 2: Partial application** — Some items are excluded, the discount
applies to the rest.

```
Cart: [Headphones ($50, ON SALE, discount_eligible: false),
       T-Shirt ($30, regular price)]
Agent applies: 20OFF (20% off)
Result: 20% applied only to T-Shirt = $6 off
```

Without per-item eligibility, the agent sees $6 off an $80 cart with no
explanation. With `discount_eligible: false` on the headphones, the behavior is
transparent.

**Scenario 3: Upfront reasoning** — The agent inspects `discount_eligible`
before attempting a code.

```
Agent sees Item A: discount_eligible: false → does NOT suggest "try a code?"
Agent sees Item B: no discount_eligible field → defaults to true → CAN suggest
```

This avoids trial-and-error and reduces unnecessary API calls.

### 7.3 Platform Precedent

Every major platform implements sale-item exclusion from discount codes:

| Platform | Mechanism |
|----------|-----------|
| Shopify | Discount eligibility rules exclude products with `compare_at_price` set |
| WooCommerce | "Exclude sale items" checkbox on coupon configuration |
| BigCommerce | Price rules with "Do not apply to items already on sale" |
| Adobe Commerce | Catalog price rules vs. cart price rules with explicit exclusion |

---

## 8. Proposed Discount Extension Amendment

This RFC proposes three additive changes to the Discount Extension to complete
the sale-discount interaction story. These amendments are bundled here because
they are motivated by the same problem (Section 7), but they affect a different
extension. If the amendments are controversial, the sale extension can land
independently — there is no coupling.

### 8.1 `discount_eligible` Field

A new flat field on `LineItem`, governed by the Discount Extension via
`$.LineItem.discount_eligible`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `discount_eligible` | boolean | No | Whether this item accepts code-based discount codes. Default: `true`. Does not affect automatic discounts. |

**Semantics:**

- `discount_eligible: false` signals that the merchant's policy excludes this
  item from code-based discounts. Automatic discounts (`automatic: true`) are
  unaffected — the merchant would not simultaneously mark an item as ineligible
  and apply an automatic discount to it.
- `discount_eligible` is independent of the `sale` extension. An item can be
  discount-ineligible without being on sale (new arrivals, MAP-restricted items,
  limited editions, pre-orders). An item can be on sale and still accept discount
  codes.
- Absence of `discount_eligible` implies `true`, preserving backward
  compatibility.

**Updated `discount` extension declaration:**

```json
{
  "name": "discount",
  "extends": [
    "$.CheckoutSessionCreateRequest.discounts",
    "$.CheckoutSessionUpdateRequest.discounts",
    "$.CheckoutSession.discounts",
    "$.LineItem.discount_eligible"
  ]
}
```

### 8.2 New Rejection Reason

A new error code for the `discounts.rejected` array:

| Code | Description |
|------|-------------|
| `discount_code_sale_item_excluded` | All eligible items in the cart are on sale and excluded from this discount code. |

This is additive to the existing rejection reason enum defined in the Discount
Extension RFC Section 7.1.

### 8.3 Excluded Items on AppliedDiscount

A new optional field on `AppliedDiscount` for partial-application transparency:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `excluded_items` | ExcludedItem[] | No | Items excluded from this discount, with reasons. |

**ExcludedItem:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | JSONPath to the excluded line item (e.g., `$.line_items[0]`). |
| `reason` | string | Yes | Why the item was excluded (e.g., `sale_item`). |

**Example:**

```json
{
  "id": "di_save20",
  "code": "SAVE20",
  "coupon": { "id": "c_save20", "name": "20% Off", "percent_off": 20 },
  "amount": 600,
  "method": "each",
  "allocations": [{ "path": "$.line_items[1]", "amount": 600 }],
  "excluded_items": [
    { "path": "$.line_items[0]", "reason": "sale_item" }
  ]
}
```

### 8.4 Independence Note

The sale extension has no structural dependency on the discount extension
amendments. The `sale` extension adds `$.CheckoutSession.sales` and
`$.LineItem.sale`. The discount amendments add `$.LineItem.discount_eligible`, a
new rejection reason, and an optional field on `AppliedDiscount`. A merchant MAY
implement either or both. When both are present, the agent gets the full picture:
"on sale, and no codes accepted."

---

## 9. Examples

Full example payloads are provided in the `examples/unreleased/sale-extension/`
directory. The following summaries describe each scenario.

### 9.1 Capabilities Declaration (Both Extensions)

A merchant supporting both the sale extension and the amended discount extension
declares both in `capabilities.extensions`. The agent knows: the session will
include a `sales[]` registry and line items may include `sale` objects and
`discount_eligible` fields.

### 9.2 Item on Sale (Winter Sale)

A single item on sale with full sale context: session-level `Sale` entry with
name, description, and window; line-item `sale` object with `compare_at_amount`
and EU Omnibus fields. Agent can narrate: "Wireless Headphones — $50 (was $75,
33% off). Winter Sale — seasonal clearance, up to 40% off. Ends Feb 14. Lowest
price in the last 30 days was $55."

### 9.3 Mixed Cart (Sale + Regular Price, with Discount)

A cart containing one sale item (discount-ineligible) and one regular-price item.
A discount code is applied and allocates only to the regular-price item. The
`excluded_items` field on `AppliedDiscount` explains why the sale item was
skipped.

### 9.4 Discount-Ineligible Without Sale

A line item with `discount_eligible: false` but no `sale` object. This
demonstrates that discount eligibility is independent of sale status — the item
is excluded from discount codes due to merchant policy (e.g., new arrival,
limited edition, MAP restriction), not because it is on sale.

### 9.5 BFCM Cart (Multiple Concurrent Sales)

A large cart with items spanning two concurrent sales (a 6-hour Doorbuster and a
month-long Holiday Savings campaign) plus a regular-price item. The `sales[]`
array is ordered by urgency (Doorbuster first). Demonstrates the normalized
model with `metadata` for merchant-specific taxonomy and
`lowest_recent_period_days: 365` for "lowest price this year" messaging.

---

## 10. Backward Compatibility

### 10.1 No Breaking Changes

This RFC is fully additive:

1. The `sale` extension is opt-in via `capabilities.extensions[]`. Merchants that
   do not declare it are unaffected.
2. All sale fields are response-only. No existing request formats change.
3. `discount_eligible` is an optional field with a default of `true`. Its absence
   preserves current behavior identically.
4. The new rejection reason `discount_code_sale_item_excluded` is additive to the
   existing enum. Agents that do not recognize it can treat it as a generic
   rejection.
5. `excluded_items` on `AppliedDiscount` is optional. Existing discount
   responses remain valid.

### 10.2 Clients Without Extension Support

- Clients that do not support the sale extension **SHOULD** ignore the `sales[]`
  array and `sale` objects in responses.
- The `totals[]` array still reflects the sale price via `unit_amount`. The sale
  extension adds context, not new monetary calculations.
- Line-item totals are unaffected — `unit_amount` already contains the sale
  price.

### 10.3 Existing Merchants

No migration is required. Merchants that do not run sales or do not wish to
expose sale context simply omit the extension declaration. Their checkout
responses remain unchanged.

---

## 11. Security Considerations

- **No PCI scope change.** Sale pricing is display metadata, not payment data. No
  sensitive data is introduced by this extension.
- **Merchant responsibility.** `lowest_recent_amount` and
  `lowest_recent_period_days` are merchant-asserted values. ACP does not validate
  pricing claims — compliance with EU Omnibus or other regulations is the
  merchant's responsibility. The protocol provides the fields; the merchant
  provides accurate data.
- **No new attack surface.** All fields are response-only. The agent cannot
  manipulate sale pricing. The merchant is the sole authority over sale context.
- **Price manipulation risk.** Merchants could theoretically inflate
  `compare_at_amount` to create misleading "was" prices. This is a regulatory
  concern (exactly what EU Omnibus addresses), not a protocol security concern.
  ACP's role is to provide structured fields; enforcement is regulatory.
- **Rate limiting.** No additional rate limiting considerations beyond what ACP
  already recommends. Sale fields do not introduce new request-side inputs.

---

## 12. Conformance Checklist

**Sale Extension:**

- [ ] Declares `sale` in `capabilities.extensions` with
  `extends: ["$.CheckoutSession.sales", "$.LineItem.sale"]`
- [ ] Session-level `sales[]` contains an entry for each active sale referenced
  by line items
- [ ] Every `Sale` entry in `sales[]` has a required `id` field
- [ ] `Sale.id` is a stable identifier consistent across sessions
- [ ] Every line-item `sale` object has a required `id` referencing a `sales[]`
  entry and a required `compare_at_amount`
- [ ] `compare_at_amount` is strictly greater than the line item's `unit_amount`
- [ ] `lowest_recent_amount`, when present, is less than or equal to
  `compare_at_amount`
- [ ] `lowest_recent_period_days` is present when `lowest_recent_amount` is
  present
- [ ] `end` is omitted or in the future (no stale sale data)
- [ ] No orphan sales in `sales[]` (every entry referenced by at least one line
  item)
- [ ] `sales[]` array ordering reflects presentation priority (most
  prominent/urgent first)
- [ ] `metadata` values are strings (no nested objects or arrays)
- [ ] Extension fields are omitted (not `null`) when not applicable
- [ ] Absence of `sale` on a line item implies regular price

**Discount Extension Amendment (proposed):**

- [ ] `discount` extension `extends` array includes
  `$.LineItem.discount_eligible`
- [ ] `discount_eligible` is a flat field on `LineItem`, not inside the `sale`
  object
- [ ] `discount_eligible` accurately reflects the merchant's code-based discount
  policy for the item
- [ ] `discount_eligible` does not affect automatic discount application
- [ ] Absence of `discount_eligible` implies `true`
- [ ] `discount_code_sale_item_excluded` rejection reason is used when all
  eligible items are sale-excluded

---

## 13. Change Log

- **2026-02-09**: Initial draft
