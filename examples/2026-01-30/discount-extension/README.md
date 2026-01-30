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
Demonstrates how rejected discount codes are communicated via:
- The `discounts.rejected` array with the code and reason
- The `messages[]` array to surface warnings to users

One code succeeds (`SAVE10`), one is rejected as expired (`EXPIRED50`).

### [stacked-discounts.json](./stacked-discounts.json)
Complex example showing multiple discounts stacked together with:
- Priority ordering (which discount is calculated first)
- Different allocation methods (`each` vs `across`)
- `each` discounts include allocations; `across` discounts apply to order total

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
  "capabilities": {
    "payment_methods": ["card"],
    "extensions": [
      {
        "name": "discount",
        "extends": [
          "$.CheckoutSessionCreateRequest.discounts",
          "$.CheckoutSessionUpdateRequest.discounts",
          "$.CheckoutSession.discounts"
        ]
      }
    ]
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
    ],
    "rejected": [
      {
        "code": "DISCOUNT_CODE_2",
        "reason": "discount_code_expired",
        "message": "Code expired on December 1st"
      }
    ]
  }
}
```

### The `extends` Field

The `extends` field uses JSONPath expressions to precisely identify which schema fields are added by the extension:

| JSONPath | Description |
|----------|-------------|
| `$.CheckoutSessionCreateRequest.discounts` | Adds `discounts` to create requests |
| `$.CheckoutSessionUpdateRequest.discounts` | Adds `discounts` to update requests |
| `$.CheckoutSession.discounts` | Adds `discounts` to session responses |

### The `schema` Field (Optional)

The optional `schema` field provides a URL to a JSON Schema defining the structure of the extension's added fields:

```json
{
  "name": "discount",
  "extends": ["$.CheckoutSession.discounts"],
  "schema": "https://agenticcommerce.dev/schemas/discount/2026-01-27.json"
}
```

This enables:
- **Runtime validation** of extension data
- **SDK generation** from the schema
- **Interoperability** with unknown extensions

### Allocation Methods

| Method | Description | Allocations |
|--------|-------------|-------------|
| `each` | Discount calculated independently for each item | Typically included |
| `across` | Discount applied to order total | Typically omitted |

### Priority Ordering

When multiple discounts are stacked, `priority` determines calculation order:
- Priority 1 is applied first
- Lower numbers = earlier in calculation
- Each subsequent discount is calculated on the already-discounted amount

## Related Documentation

- [RFC: Extensions Framework](../../rfcs/rfc.extensions.md)
- [RFC: Discount Extension](../../rfcs/rfc.discount_extension.md)
- [JSON Schema](../../spec/unreleased/json-schema/schema.discount.json)

