# RFC: Discount Extension

**Status:** Draft
**Version:** 2026-01-27
**Scope:** Discount code support with rich applied discounts
**Depends on:** RFC: ACP Extensions Framework

This RFC defines the **Discount Extension**, the first extension implemented
under the ACP Extensions Framework. It enables merchants to support discount
codes on checkout sessions and provides rich information about applied
discounts.

---

## 1. Scope & Goals

- Provide **discount code input** via the `discounts.codes` array
- Return **rich applied discount data** including title, amount, and allocation
- Support **automatic discounts** that merchants apply without codes
- Communicate **rejected codes** via the `messages[]` array with specific error
  codes
- Enable **interoperability** with other commerce protocols

**Out of scope:** Discount creation/management APIs, coupon validation rules,
loyalty point redemption.


---

## 2. Motivation

### 2.1 Building on the Foundation

ACP provides basic discount support via the `coupons` array in requests and
`DiscountDetail` type in line items. This extension enhances these capabilities
with a richer feature set.

### 2.2 What This Extension Adds

This extension introduces:

- **Rich applied discount responses** with full discount metadata
- **Allocation details** showing exactly where discounts were applied
- **Automatic discount support** for merchant-initiated promotions
- **Stacking order** for predictable multi-discount calculations
- **Coupon/promotion model** with comprehensive discount metadata

---

## 3. Extension Declaration

Merchants advertise discount support in the checkout response:

```json
{
  "protocol": {
    "version": "2026-01-27",
    "extensions": ["discount"]
  }
}
```

---

## 4. Schema

When this extension is active, checkout is extended with a `discounts` object.

### 4.1 Discounts Object

| Field | Type | Request | Response | Description |
|-------|------|---------|----------|-------------|
| `codes` | string[] | Optional | Echo | Discount codes to apply. Case-insensitive. Replaces previously submitted codes. |
| `applied` | AppliedDiscount[] | Omit | Required | Discounts successfully applied (code-based and automatic). |

### 4.2 Applied Discount

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for this applied discount |
| `code` | string | No | The discount code. Omitted for automatic discounts. |
| `coupon` | Coupon | Yes | Details about the underlying coupon/promotion |
| `amount` | integer | Yes | Total discount amount in minor currency units |
| `automatic` | boolean | No | True if applied automatically (no code required). Default: false |
| `start` | string | No | RFC 3339 timestamp when discount became active |
| `end` | string | No | RFC 3339 timestamp when discount expires |
| `method` | string | No | Allocation method: `each` or `across` |
| `priority` | integer | No | Stacking order (1 = first). Lower numbers applied first. |
| `allocations` | Allocation[] | No | Breakdown of where discount was allocated |

### 4.3 Coupon

Nested coupon details describing the discount terms:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique coupon identifier |
| `name` | string | Yes | Human-readable coupon name |
| `percent_off` | number | No | Percentage discount (0-100). Mutually exclusive with `amount_off`. |
| `amount_off` | integer | No | Fixed discount in minor units. Mutually exclusive with `percent_off`. |
| `currency` | string | No | Currency for `amount_off` (ISO 4217). Required if `amount_off` is set. |
| `duration` | string | No | How long discount applies: `once`, `repeating`, `forever` |
| `duration_in_months` | integer | No | Number of months (if duration is `repeating`) |
| `max_redemptions` | integer | No | Maximum times this coupon can be redeemed |
| `times_redeemed` | integer | No | Number of times redeemed |
| `metadata` | object | No | Arbitrary key-value metadata |

### 4.4 Allocation

Breakdown of how a discount amount was allocated to a specific target:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | JSONPath to the allocation target (e.g., `$.line_items[0]`) |
| `amount` | integer | Yes | Amount allocated to this target in minor currency units |

---

## 5. Allocation Details

### 5.1 Allocation Method

The `method` field indicates how the discount was calculated:

| Method | Meaning | Example |
|--------|---------|---------|
| `each` | Applied independently per eligible item | "10% off each item" → 10% × item price |
| `across` | Split proportionally by value | "$10 off order" → $6 to $60 item, $4 to $40 item |

### 5.2 Stacking Order

When multiple discounts are applied, `priority` indicates calculation order.
Lower numbers are applied first:

```
Cart: $100
Discount A (priority: 1): 20% off → $100 × 0.8 = $80
Discount B (priority: 2): $10 off → $80 - $10 = $70
```

### 5.3 Allocations Array

The `allocations` array breaks down where each discount dollar landed, using
JSONPath to identify targets:

| Path Pattern | Target |
|--------------|--------|
| `$.line_items[0]` | First line item |
| `$.line_items[1]` | Second line item |
| `$.totals.shipping` | Shipping cost |

**Invariant:** Sum of `allocations[].amount` equals `applied_discount.amount`.

---

## 6. Operations

Discount codes are submitted via standard checkout create/update operations.

### 6.1 Request Behavior

- **Replacement semantics**: Submitting `discounts.codes` replaces any
  previously submitted codes
- **Clear codes**: Send empty array `"codes": []` to remove all discount codes
- **Case-insensitive**: Codes are matched case-insensitively by merchant
- **Backward compatibility**: The `coupons` field is a deprecated alias for
  `discounts.codes`

### 6.2 Response Behavior

- `discounts.applied` contains all active discounts (code-based + automatic)
- Rejected codes communicated via `messages[]` (see below)
- Discount amounts reflected in `totals[]` and `line_items[].discount`

---

## 7. Rejected Codes

When a submitted discount code cannot be applied, merchants communicate this
via the `messages[]` array:

```json
{
  "messages": [
    {
      "type": "warning",
      "code": "discount_code_expired",
      "param": "$.discounts.codes[0]",
      "content_type": "plain",
      "content": "Code 'SUMMER20' expired on December 1st"
    }
  ]
}
```

### 7.1 Error Codes

| Code | Description |
|------|-------------|
| `discount_code_expired` | Code has expired |
| `discount_code_invalid` | Code not found or malformed |
| `discount_code_already_applied` | Code is already applied |
| `discount_code_combination_disallowed` | Cannot combine with another active discount |
| `discount_code_minimum_not_met` | Order does not meet minimum purchase requirement |
| `discount_code_user_not_logged_in` | Code requires authenticated user |
| `discount_code_user_ineligible` | User does not meet eligibility criteria |
| `discount_code_usage_limit_reached` | Code has reached maximum redemptions |

### 7.2 Message Severity

Operations that affect order totals **SHOULD** use `type: "warning"` to ensure
they are surfaced to the user. Rejected discounts are a prime example—the user
expects a discount but won't receive it, so they should be informed.

---

## 8. Impact on Line Items and Totals

Applied discounts are reflected in the core checkout fields:

| Total Type | When to Use |
|------------|-------------|
| `items_discount` | Discounts allocated to line items |
| `discount` | Order-level discounts (shipping, fees, flat order amount) |

### 8.1 Determining the Type

- If a discount has `allocations` pointing to line items → `items_discount`
- Discounts without allocations or with allocations to shipping/fees → `discount`

### 8.2 Invariants

- `totals[type=items_discount].amount` equals `sum(line_items[].discount)`
- All discount amounts are positive integers in minor currency units
- Display as subtractive (e.g., "-$13.99") when presenting to users

---

## 9. Examples

### 9.1 Order-level Discount

**Request:**

```json
{
  "line_items": [{"id": "item_123", "quantity": 1}],
  "discounts": {
    "codes": ["SAVE10"]
  }
}
```

**Response:**

```json
{
  "id": "checkout_session_123",
  "protocol": {
    "version": "2026-01-27",
    "extensions": ["discount"]
  },
  "discounts": {
    "codes": ["SAVE10"],
    "applied": [
      {
        "id": "di_abc123",
        "code": "SAVE10",
        "coupon": {
          "id": "coupon_xyz",
          "name": "$10 Off Your Order",
          "amount_off": 1000,
          "currency": "usd",
          "duration": "once"
        },
        "amount": 1000
      }
    ]
  },
  "totals": [
    {"type": "subtotal", "display_text": "Subtotal", "amount": 5000},
    {"type": "discount", "display_text": "Order Discount", "amount": 1000},
    {"type": "total", "display_text": "Total", "amount": 4000}
  ]
}
```

### 9.2 Percentage Discount with Allocations

**Request:**

```json
{
  "discounts": {
    "codes": ["SUMMER20"]
  }
}
```

**Response:**

```json
{
  "discounts": {
    "codes": ["SUMMER20"],
    "applied": [
      {
        "id": "di_def456",
        "code": "SUMMER20",
        "coupon": {
          "id": "coupon_summer",
          "name": "Summer Sale 20% Off",
          "percent_off": 20,
          "duration": "once"
        },
        "amount": 800,
        "method": "each",
        "allocations": [
          {"path": "$.line_items[0]", "amount": 800}
        ]
      }
    ]
  },
  "line_items": [
    {
      "id": "li_1",
      "item": {"id": "prod_1", "quantity": 2},
      "name": "T-Shirt",
      "unit_amount": 2000,
      "totals": [
        {"type": "subtotal", "amount": 4000},
        {"type": "items_discount", "amount": 800},
        {"type": "total", "amount": 3200}
      ]
    }
  ]
}
```

### 9.3 Automatic Discount

**Response (no code submitted):**

```json
{
  "discounts": {
    "codes": [],
    "applied": [
      {
        "id": "di_auto_789",
        "coupon": {
          "id": "coupon_freeship",
          "name": "Free shipping on orders over $50",
          "amount_off": 599,
          "currency": "usd"
        },
        "amount": 599,
        "automatic": true
      }
    ]
  }
}
```

### 9.4 Rejected Discount Code

**Request:**

```json
{
  "discounts": {
    "codes": ["SAVE10", "EXPIRED50"]
  }
}
```

**Response:**

```json
{
  "discounts": {
    "codes": ["SAVE10", "EXPIRED50"],
    "applied": [
      {
        "id": "di_abc123",
        "code": "SAVE10",
        "coupon": {
          "id": "coupon_xyz",
          "name": "$10 Off Your Order",
          "amount_off": 1000,
          "currency": "usd"
        },
        "amount": 1000
      }
    ]
  },
  "messages": [
    {
      "type": "warning",
      "code": "discount_code_expired",
      "param": "$.discounts.codes[1]",
      "content_type": "plain",
      "content": "Code 'EXPIRED50' expired on December 1st"
    }
  ]
}
```

### 9.5 Stacked Discounts

**Response:**

```json
{
  "discounts": {
    "codes": ["SUMMER20", "LOYALTY5"],
    "applied": [
      {
        "id": "di_summer",
        "code": "SUMMER20",
        "coupon": {
          "id": "coupon_summer",
          "name": "Summer Sale 20% Off",
          "percent_off": 20
        },
        "amount": 2000,
        "method": "each",
        "priority": 1,
        "allocations": [
          {"path": "$.line_items[0]", "amount": 1200},
          {"path": "$.line_items[1]", "amount": 800}
        ]
      },
      {
        "id": "di_loyalty",
        "code": "LOYALTY5",
        "coupon": {
          "id": "coupon_loyalty",
          "name": "$5 Loyalty Reward",
          "amount_off": 500,
          "currency": "usd"
        },
        "amount": 500,
        "method": "across",
        "priority": 2,
        "allocations": [
          {"path": "$.line_items[0]", "amount": 300},
          {"path": "$.line_items[1]", "amount": 200}
        ]
      }
    ]
  }
}
```

---

## 10. Backward Compatibility

### 10.1 Coupons Field Deprecation

The `coupons` field in requests is a **deprecated alias** for `discounts.codes`:

```json
// Old format (deprecated but supported)
{
  "coupons": ["SAVE10"]
}

// New format (preferred)
{
  "discounts": {
    "codes": ["SAVE10"]
  }
}
```

Merchants **SHOULD** accept both formats. If both are present, `discounts.codes`
takes precedence.

### 10.2 Clients Without Extension Support

- Clients that don't support the discount extension **SHOULD** ignore the
  `discounts` object in responses
- The `totals[]` array still reflects applied discounts
- Line item `discount` fields still contain discount amounts

---

## 11. Security Considerations

- Discount codes are not considered sensitive data (no PCI implications)
- Automatic discounts expose merchant pricing logic (acceptable for
  transparency)
- Rate limiting **SHOULD** be applied to prevent discount code enumeration
  attacks

---

## 12. Conformance Checklist

- [ ] Accepts `discounts.codes` in create/update requests
- [ ] Returns `discounts.applied` array with applied discounts
- [ ] Includes `coupon` object with `name` and discount details
- [ ] Supports automatic discounts with `automatic: true`
- [ ] Returns rejection reasons via `messages[]` with appropriate codes
- [ ] Reflects discounts in `totals[]` and line item totals
- [ ] Accepts deprecated `coupons` field as alias

---

## 13. Change Log

- **2026-01-27**: Initial draft

