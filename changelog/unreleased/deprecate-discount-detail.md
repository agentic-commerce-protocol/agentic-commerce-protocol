# Unreleased Changes

## Consolidate `DiscountDetail` into `AppliedDiscount`

ACP had two overlapping discount representations: `DiscountDetail` in the base schema (5 fields, no RFC) and `AppliedDiscount` in the Discount Extension (11+ fields, full RFC). Two `DiscountDetail` fields — `description` and `type` — had no migration target in `AppliedDiscount`, blocking lossless deprecation. This change closes the parity gap and deprecates `DiscountDetail`.

### Parity Additions

New optional fields on `AppliedDiscount`:

| Field | Type | Source |
|-------|------|--------|
| `description` | `string` | Mirrors `DiscountDetail.description` — human-readable discount description |
| `type` | `string` enum `["percentage", "fixed", "bogo", "volume"]` | Mirrors `DiscountDetail.type` — discount type |

### Deprecation

- **`DiscountDetail`** type and `LineItem.discount_details[]` field: deprecated (unchanged from prior commit in base schema).
- **`AppliedDiscount.automatic`** field: deprecated. Use the absence of `code` to identify automatic discounts instead.

### Lossless Field Mapping

| `DiscountDetail` field | `AppliedDiscount` field | Notes |
|------------------------|------------------------|-------|
| `code` | `code` | Direct mapping |
| `type` | `type` | Same enum values |
| `amount` | `amount` | Direct mapping |
| `description` | `description` | Direct mapping (new) |
| `source` | Derived from `code` presence | `coupon` → `code` present; `automatic`/`loyalty` → `code` absent |

### Schema Changes

- **JSON Schema** (`schema.discount.json`): Added `description` and `type` to `applied_discount.properties`; marked `automatic` as deprecated.
- **OpenAPI** (`openapi.agentic_checkout.yaml`): Added `description` and `type` to `AppliedDiscount.properties`; marked `automatic` as deprecated.

### RFC Changes

- **§2.1**: Updated motivation to mention consolidation with parity additions.
- **§4.2**: Added `description` and `type` rows; marked `automatic` as deprecated.
- **§9.3**: Added deprecation note on `automatic` field.
- **§10.2**: Added lossless field parity table; updated source mapping to use `code` presence/absence; updated migration example with `description` and `type`.
- **§10.3**: Rewrote normative boundary to use `code` presence/absence as primary signal; noted `automatic` is deprecated.
- **§12**: Updated conformance checklist.
- **§13**: Updated changelog entry.

### Related

- Closes #124
