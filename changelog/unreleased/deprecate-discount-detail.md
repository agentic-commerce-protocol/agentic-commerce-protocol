# Unreleased Changes

## Consolidate `DiscountDetail` into `AppliedDiscount`

ACP had two overlapping discount representations: `DiscountDetail` in the base schema (5 fields, no RFC) and `AppliedDiscount` in the Discount Extension (11+ fields, full RFC). Two `DiscountDetail` fields — `description` and `type` — had no migration target in `AppliedDiscount`, blocking lossless deprecation. This change closes the parity gap and deprecates `DiscountDetail`.

### Parity Additions

New optional fields on `AppliedDiscount`:

| Field | Type | Source |
|-------|------|--------|
| `description` | `string` | Mirrors `DiscountDetail.description` — human-readable discount description |
| `type` | `string` enum `["percentage", "fixed"]` | Classification convenience for agents; `bogo`/`volume` deferred to future proposal |

### Removals

- **`AppliedDiscount.automatic`** field: removed (clean break). Use the absence of `code` to identify automatic discounts instead. No released version exists with this field in the Discount Extension schema.

### Deprecation

- **`DiscountDetail`** type and `LineItem.discount_details[]` field: deprecated (unchanged from prior commit in base schema).

### Lossless Field Mapping

| `DiscountDetail` field | `AppliedDiscount` field | Notes |
|------------------------|------------------------|-------|
| `code` | `code` | Direct mapping |
| `type` | `type` | `percentage`/`fixed` map directly; `bogo`/`volume` deferred to future proposal |
| `amount` | `amount` | Direct mapping |
| `description` | `description` | Direct mapping (new) |
| `source` | Derived from `code` presence | `coupon` → `code` present; `automatic`/`loyalty` → `code` absent |

### Migration Guidance

- **Per-item allocation visibility**: Merchants migrating from `discount_details[]` who provided per-item discount information SHOULD populate `allocations[]` on `AppliedDiscount` to preserve that visibility.
- **Loyalty metadata**: The `loyalty` source mapping relies on `coupon.metadata` — merchants should populate metadata consistently. A future proposal may define recommended metadata keys.

### Schema Changes

- **JSON Schema** (`schema.discount.json`): Added `description` and `type` to `applied_discount.properties`; removed `automatic`.
- **OpenAPI** (`openapi.agentic_checkout.yaml`): Added `description` and `type` to `AppliedDiscount.properties`; removed `automatic`.
- **Example** (`automatic-discount.json`): Removed `automatic: true` from automatic discount example.

### RFC Changes

- **§2.1**: Updated motivation to mention consolidation with parity additions.
- **§4.2**: Added `description` and `type` rows; removed `automatic` field.
- **§9.3**: Updated automatic discount example (removed `automatic: true`).
- **§10.2**: Added lossless field parity table; per-item allocation migration note; loyalty metadata tradeoff callout.
- **§10.3**: Normative boundary uses `code` presence/absence as sole signal.
- **§10.4**: New section documenting deferred `bogo`/`volume` type extensions.
- **§12**: Updated conformance checklist.
- **§13**: Updated changelog entries.

### Related

- Closes #124
