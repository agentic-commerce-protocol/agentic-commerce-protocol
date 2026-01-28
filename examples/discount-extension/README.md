# Discount Extension Examples

This directory contains examples demonstrating the ACP Discount Extension functionality.

## Examples

### [order-level-discount.json](./order-level-discount.json)
Basic example of applying a fixed-amount discount code (`SAVE10` = $10 off) to an order.

### [percentage-discount-with-allocations.json](./percentage-discount-with-allocations.json)
Demonstrates a percentage discount (20% off) with detailed `allocations` showing exactly how the discount was distributed across multiple line items.

### [automatic-discount.json](./automatic-discount.json)
Shows an automatic discount applied by the merchant without any code input. In this example, free shipping is automatically applied when the order exceeds $50.

### [rejected-discount-code.json](./rejected-discount-code.json)
Demonstrates how rejected discount codes are communicated via the `messages[]` array while still applying valid codes. One code succeeds (`SAVE10`), one is rejected as expired (`EXPIRED50`).

### [stacked-discounts.json](./stacked-discounts.json)
Complex example showing multiple discounts stacked together with:
- Priority ordering (which discount is calculated first)
- Different allocation methods (`each` vs `across`)
- Detailed allocation breakdowns for each discount

## Key Concepts

### Request Format

```json
{
  "discounts": {
    "codes": ["DISCOUNT_CODE_1", "DISCOUNT_CODE_2"]
  }
}
```

### Response Format

```json
{
  "protocol": {
    "version": "2026-01-27",
    "extensions": ["discount"]
  },
  "discounts": {
    "codes": ["DISCOUNT_CODE_1", "DISCOUNT_CODE_2"],
    "applied": [
      {
        "id": "di_abc123",
        "code": "DISCOUNT_CODE_1",
        "coupon": {
          "id": "coupon_xyz",
          "name": "Discount Name",
          "percent_off": 20
        },
        "amount": 1000,
        "allocations": [...]
      }
    ]
  }
}
```

### Allocation Methods

| Method | Description |
|--------|-------------|
| `each` | Discount calculated independently for each item |
| `across` | Discount split proportionally by value across items |

### Priority Ordering

When multiple discounts are stacked, `priority` determines calculation order:
- Priority 1 is applied first
- Lower numbers = earlier in calculation
- Each subsequent discount is calculated on the already-discounted amount

## Related Documentation

- [RFC: Extensions Framework](../../rfcs/rfc.extensions.md)
- [RFC: Discount Extension](../../rfcs/rfc.discount_extension.md)
- [JSON Schema](../../spec/unreleased/json-schema/schema.discount.json)

