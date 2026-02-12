# RFC: Seller-Backed Payment Handler

**Handler name** (in `capabilities.payment.handlers`): `dev.acp.seller_backed` (base pattern)  
**Status**: Draft  
**Created**: 2026-02-05  
**Last Updated**: 2026-02-05  
**Aligns with**: Agentic Checkout schema 2026-01-30 (capabilities.payment.handlers)

---

## 1. Abstract

This RFC defines the `dev.acp.seller_backed` payment handler pattern, which enables sellers to declare payment options that are managed and resolved entirely on the seller's backend without transferring credentials to the agent. This pattern supports:

- **`dev.acp.seller_backed.saved_card`** - User's payment methods saved at the seller
- **`dev.acp.seller_backed.gift_card`** - Seller-issued gift cards requiring user input
- **`dev.acp.seller_backed.points`** - Seller's rewards/points programs
- **`dev.acp.seller_backed.store_credit`** - Seller-managed account balances

These handlers maintain ACP's security and observability model by requiring tokenization through the `delegate_payment` endpoint, enabling audit trails, refund handling, and dispute management visibility for agents, while never requiring credential transfer or PCI compliance.

---

## 2. Motivation

### The Problem

Sellers with their own payment infrastructure want to offer their customers the ability to use:
- Payment methods saved directly with the seller
- Loyalty points accumulated through the seller's rewards program  
- Gift cards issued by the seller
- Store credit on the customer's account

Currently, ACP's payment handler framework focuses on credential-based payments (cards, wallets) but doesn't provide a standardized way for sellers to declare and manage seller-specific payment options that are resolved entirely on the seller's backend without requiring credential transfer or PCI compliance.

### Why Not Just Pass IDs?

A naive approach would be to simply pass seller-provided payment IDs through without tokenization:
```
Agent → Seller: "Use seller_pm_123"
Seller → charges directly
```

**This bypasses critical ACP functionality:**
- ❌ No audit trail of payment attempts
- ❌ No visibility into refunds/disputes for agents
- ❌ No standardized observability metrics
- ❌ No allowance/constraint enforcement

### The Solution

The `dev.acp.seller_backed` pattern maintains protocol integrity by:
1. ✅ Seller declares available payment options via handler declarations (each with an `id`)
2. ✅ Agent presents options to user using seller-provided display metadata
3. ✅ Agent tokenizes selection via `delegate_payment` (no credentials transferred)
4. ✅ Agent submits complete request to seller with the handler's `id` (so seller knows which option the user chose) and the payment token
5. ✅ Seller uses the returned handler id and token to process payment

This ensures agents maintain visibility into the payment lifecycle while sellers retain full control over credential resolution and processing, **without requiring any credential transfer or PCI compliance**.

---

## 3. Handler Pattern

### 3.1 Base Pattern: `dev.acp.seller_backed`

**Purpose**: Foundation for seller-managed payment options that require no credential transfer

**Common Properties**:
- `requires_delegate_payment`: MUST be `true`
- `requires_pci_compliance`: MUST be `false` (no credentials transferred)
- `psp`: SHOULD be `"seller_managed"` to indicate seller-side processing

**Handler Naming**:
- Base: `dev.acp.seller_backed` (abstract pattern)
- Implementations: `dev.acp.seller_backed.{type}` where type is one of:
  - `saved_card` - Saved payment methods
  - `gift_card` - Seller-issued gift cards  
  - `points` - Loyalty/rewards points
  - `store_credit` - Account balance/credit

**Declaration**: Handlers are declared in the checkout session response under `capabilities.payment.handlers` (see [RFC: Agentic Checkout](./rfc.agentic_checkout.md) and the Agentic Checkout JSON Schema).

### 3.2 Handler Types

#### 3.2.1 Saved Card: `dev.acp.seller_backed.saved_card`

Pre-existing payment methods saved at the seller. Seller declares one handler instance per saved payment method for the authenticated user.

**Handler Declaration Example**:
```json
{
  "id": "seller_pm_123",
  "name": "dev.acp.seller_backed.saved_card",
  "version": "2026-02-05",
  "spec": "https://acp.dev/handlers/seller_backed/saved_card",
  "requires_delegate_payment": true,
  "requires_pci_compliance": false,
  "psp": "seller_managed",
  "config_schema": "https://acp.dev/schemas/handlers/seller_backed/saved_card/config.json",
  "instrument_schemas": ["https://acp.dev/schemas/handlers/seller_backed/saved_card/instrument.json"],
  "config": {
    "merchant_id": "walmart_merchant_123",
    "psp": "seller_managed",
    "payment_method_id": "wmt_pm_123",
    "display_name": "Visa ending in 4242",
    "display_metadata": {
      "brand": "visa",
      "last4": "4242"
    },
    "supports_3ds": true
  }
}
```

**Flow**:
1. User selects handler from list
2. Agent calls `delegate_payment` with handler_id
3. Agent sends complete request with handler_id (so seller knows which option was chosen) and token; seller resolves handler_id to original payment method and charges
4. If 3DS required: Agent handles authentication via `delegate_authentication` flow

**3DS Authentication**:
When `supports_3ds: true`, the seller may require 3DS authentication. The agent handles this using the existing `delegate_authentication` endpoint, maintaining a consistent authentication flow across payment types.

#### 3.2.2 Gift Card: `dev.acp.seller_backed.gift_card`

Requires user to input gift card details at checkout time.

**Handler Declaration Example**:
```json
{
  "id": "gift_card_handler",
  "name": "dev.acp.seller_backed.gift_card",
  "version": "2026-02-05",
  "spec": "https://acp.dev/handlers/seller_backed/gift_card",
  "requires_delegate_payment": true,
  "requires_pci_compliance": false,
  "psp": "seller_managed",
  "config_schema": "https://acp.dev/schemas/handlers/seller_backed/gift_card/config.json",
  "instrument_schemas": ["https://acp.dev/schemas/handlers/seller_backed/gift_card/instrument.json"],
  "config": {
    "merchant_id": "walmart_merchant_123",
    "psp": "seller_managed",
    "display_name": "Walmart Gift Card",
    "required_fields": [
      {
        "name": "card_number",
        "label": "Gift Card Number",
        "type": "text",
        "required": true,
        "pattern": "^[0-9]{16}$",
        "placeholder": "1234567890123456",
        "description": "16-digit number on the front of your gift card"
      },
      {
        "name": "pin",
        "label": "PIN",
        "type": "text",
        "required": true,
        "pattern": "^[0-9]{4}$",
        "placeholder": "1234",
        "secure": true,
        "description": "4-digit PIN on the back of your gift card"
      }
    ]
  }
}
```

**Flow**:
1. User selects gift card handler
2. Agent prompts user to fill required fields
3. User inputs card_number + PIN
4. Agent calls `delegate_payment` with collected field values
5. Agent sends complete request with handler_id and token; seller receives them and validates/charges gift card

#### 3.2.3 Points: `dev.acp.seller_backed.points`

Loyalty/rewards points balance. Seller declares this handler ONLY if user has sufficient points for the purchase.

**Handler Declaration Example**:
```json
{
  "id": "loyalty_points",
  "name": "dev.acp.seller_backed.points",
  "version": "2026-02-05",
  "spec": "https://acp.dev/handlers/seller_backed/points",
  "requires_delegate_payment": true,
  "requires_pci_compliance": false,
  "psp": "seller_managed",
  "config_schema": "https://acp.dev/schemas/handlers/seller_backed/points/config.json",
  "instrument_schemas": ["https://acp.dev/schemas/handlers/seller_backed/points/instrument.json"],
  "config": {
    "merchant_id": "walmart_merchant_123",
    "psp": "seller_managed",
    "display_name": "Walmart Rewards Points",
    "display_metadata": {
      "balance": 15000,
      "balance_display": "15,000 points ($150.00)",
      "conversion_rate": "100 points = $1.00"
    }
  }
}
```

**Flow**:
1. User selects points handler
2. Agent calls `delegate_payment` with handler_id
3. Agent sends complete request with handler_id and token; seller receives them and deducts points from user's account

#### 3.2.4 Store Credit: `dev.acp.seller_backed.store_credit`

Account balance or store credit managed by seller.

**Handler Declaration Example**:
```json
{
  "id": "store_credit_handler",
  "name": "dev.acp.seller_backed.store_credit",
  "version": "2026-02-05",
  "spec": "https://acp.dev/handlers/seller_backed/store_credit",
  "requires_delegate_payment": true,
  "requires_pci_compliance": false,
  "psp": "seller_managed",
  "config_schema": "https://acp.dev/schemas/handlers/seller_backed/store_credit/config.json",
  "instrument_schemas": ["https://acp.dev/schemas/handlers/seller_backed/store_credit/instrument.json"],
  "config": {
    "merchant_id": "walmart_merchant_123",
    "psp": "seller_managed",
    "display_name": "Store Credit",
    "display_metadata": {
      "balance": 5000,
      "balance_display": "$50.00",
      "currency": "usd"
    }
  }
}
```

---

## 4. Complete Flow Example

### 4.1 Multiple Handler Declarations (Create Checkout Session response)

Handlers are declared in `CheckoutSession.capabilities.payment.handlers` per the Agentic Checkout schema. The create checkout session response (`POST /checkout_sessions`) returns the full session including capabilities:

```json
{
  "id": "checkout_session_123",
  "capabilities": {
    "payment": {
      "handlers": [
        {
          "id": "seller_pm_123",
          "name": "dev.acp.seller_backed.saved_card",
          "version": "2026-02-05",
          "spec": "https://acp.dev/handlers/seller_backed/saved_card",
          "requires_delegate_payment": true,
          "requires_pci_compliance": false,
          "psp": "seller_managed",
          "config_schema": "https://acp.dev/schemas/handlers/seller_backed/saved_card/config.json",
          "instrument_schemas": ["https://acp.dev/schemas/handlers/seller_backed/saved_card/instrument.json"],
          "config": {
            "merchant_id": "walmart_merchant_123",
            "psp": "seller_managed",
            "payment_method_id": "wmt_pm_123",
            "display_name": "Visa ending in 4242",
            "display_metadata": {
              "brand": "visa",
              "last4": "4242"
            },
            "supports_3ds": true
          }
        },
        {
          "id": "loyalty_points",
          "name": "dev.acp.seller_backed.points",
          "version": "2026-02-05",
          "spec": "https://acp.dev/handlers/seller_backed/points",
          "requires_delegate_payment": true,
          "requires_pci_compliance": false,
          "psp": "seller_managed",
          "config_schema": "https://acp.dev/schemas/handlers/seller_backed/points/config.json",
          "instrument_schemas": ["https://acp.dev/schemas/handlers/seller_backed/points/instrument.json"],
          "config": {
            "merchant_id": "walmart_merchant_123",
            "psp": "seller_managed",
            "display_name": "Walmart Rewards Points",
            "display_metadata": {
              "balance": 15000,
              "balance_display": "15,000 points ($150.00)"
            }
          }
        },
        {
          "id": "gift_card_handler",
          "name": "dev.acp.seller_backed.gift_card",
          "version": "2026-02-05",
          "spec": "https://acp.dev/handlers/seller_backed/gift_card",
          "requires_delegate_payment": true,
          "requires_pci_compliance": false,
          "psp": "seller_managed",
          "config_schema": "https://acp.dev/schemas/handlers/seller_backed/gift_card/config.json",
          "instrument_schemas": ["https://acp.dev/schemas/handlers/seller_backed/gift_card/instrument.json"],
          "config": {
            "merchant_id": "walmart_merchant_123",
            "psp": "seller_managed",
            "display_name": "Walmart Gift Card",
            "required_fields": [
              {
                "name": "card_number",
                "label": "Gift Card Number",
                "type": "text",
                "required": true,
                "pattern": "^[0-9]{16}$",
                "placeholder": "1234567890123456"
              },
              {
                "name": "pin",
                "label": "PIN",
                "type": "text",
                "required": true,
                "pattern": "^[0-9]{4}$",
                "secure": true
              }
            ]
          }
        }
      ]
    }
  }
}
```

### 4.2 Delegation Flow

#### Scenario A: Saved Card Selection

**Agent → delegate_payment**:
```json
POST /agentic_commerce/delegate_payment
{
  "handler_id": "seller_pm_123",
  "payment_method": {
    "type": "seller_backed_saved_card"
  },
  "allowance": {
    "reason": "one_time",
    "max_amount": 10000,
    "currency": "usd",
    "checkout_session_id": "checkout_session_123",
    "merchant_id": "walmart_merchant_123",
    "expires_at": "2026-02-05T18:00:00Z"
  }
}
```

**Response**:
```json
{
  "id": "vt_01J8Z3WXYZ9ABC",
  "object": "delegated_payment_token",
  "type": "seller_backed_saved_card",
  "allowance": { ... },
  "metadata": {
    "handler_id": "seller_pm_123",
    "payment_method_id": "wmt_pm_123"
  }
}
```

#### Scenario B: Gift Card with User Input

**Agent → delegate_payment** (after collecting user input):
```json
POST /agentic_commerce/delegate_payment
{
  "handler_id": "gift_card_handler",
  "payment_method": {
    "type": "seller_backed_gift_card",
    "fields": {
      "card_number": "1234567890123456",
      "pin": "5678"
    }
  },
  "allowance": {
    "reason": "one_time",
    "max_amount": 10000,
    "currency": "usd",
    "checkout_session_id": "checkout_session_123",
    "merchant_id": "walmart_merchant_123",
    "expires_at": "2026-02-05T18:00:00Z"
  }
}
```

### 4.3 Checkout Completion

The agent MUST send the handler's `id` (the same id the seller declared in `capabilities.payment.handlers`) back to the seller in `payment_data.handler_id` so the seller knows which option the user chose. The agent also sends the credential token from `delegate_payment` in the instrument.

**Agent → Complete Checkout Session** (`POST /checkout_sessions/{checkout_session_id}/complete`):
```json
{
  "payment_data": {
    "handler_id": "seller_pm_123",
    "instrument": {
      "type": "seller_backed_saved_card",
      "credential": {
        "type": "spt",
        "token": "vt_01J8Z3WXYZ9ABC"
      }
    }
  }
}
```

**Seller processing**:
1. Receives `payment_data` with `handler_id` (the id the seller declared for this option) and the credential token
2. Uses `handler_id` to identify which payment option the user chose; uses the token for audit/observability
3. For saved_card: charges using the payment method identified by that handler (e.g. config.payment_method_id)
4. For gift_card: validates card_number and PIN, applies balance
5. Returns success/failure to agent

---

## 5. Schema Definitions

### 5.1 Base Handler Config Schema

**Common fields for all `dev.acp.seller_backed.*` handlers**:

```json
{
  "merchant_id": {
    "type": "string",
    "description": "Seller's merchant identifier",
    "maxLength": 256,
    "required": true
  },
  "psp": {
    "type": "string",
    "description": "Payment service provider (typically 'seller_managed')",
    "required": true
  },
  "display_name": {
    "type": "string",
    "description": "Name displayed to user. Seller is responsible for ensuring this is recognizable.",
    "maxLength": 128,
    "required": true
  },
  "display_metadata": {
    "type": "object",
    "description": "Optional additional display information (shown in tooltips or secondary text)",
    "required": false
  }
}
```

### 5.2 Saved Card Config Schema

**Handler Name**: `dev.acp.seller_backed.saved_card`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/handlers/seller_backed/saved_card/config.json",
  "title": "Seller-Backed Saved Card Configuration",
  "type": "object",
  "required": ["merchant_id", "psp", "payment_method_id", "display_name"],
  "properties": {
    "merchant_id": {
      "type": "string",
      "maxLength": 256
    },
    "psp": {
      "type": "string"
    },
    "payment_method_id": {
      "type": "string",
      "description": "Seller's internal payment method identifier",
      "maxLength": 256
    },
    "display_name": {
      "type": "string",
      "description": "Display name shown to user",
      "maxLength": 128
    },
    "display_metadata": {
      "type": "object",
      "properties": {
        "brand": {
          "type": "string",
          "enum": ["visa", "mastercard", "amex", "discover"]
        },
        "last4": {
          "type": "string",
          "pattern": "^[0-9]{4}$"
        }
      }
    },
    "supports_3ds": {
      "type": "boolean",
      "description": "Whether this saved payment method may require 3DS authentication",
      "default": false
    }
  }
}
```

### 5.3 Gift Card Config Schema

**Handler Name**: `dev.acp.seller_backed.gift_card`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/handlers/seller_backed/gift_card/config.json",
  "title": "Seller-Backed Gift Card Configuration",
  "type": "object",
  "required": ["merchant_id", "psp", "display_name", "required_fields"],
  "properties": {
    "merchant_id": {
      "type": "string",
      "maxLength": 256
    },
    "psp": {
      "type": "string"
    },
    "display_name": {
      "type": "string",
      "maxLength": 128
    },
    "display_metadata": {
      "type": "object"
    },
    "required_fields": {
      "type": "array",
      "description": "Fields requiring user input",
      "items": {
        "type": "object",
        "required": ["name", "label", "type", "required"],
        "properties": {
          "name": {
            "type": "string"
          },
          "label": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": ["text", "number"]
          },
          "required": {
            "type": "boolean"
          },
          "pattern": {
            "type": "string"
          },
          "placeholder": {
            "type": "string"
          },
          "secure": {
            "type": "boolean"
          },
          "description": {
            "type": "string"
          }
        }
      }
    }
  }
}
```

### 5.4 Points Config Schema

**Handler Name**: `dev.acp.seller_backed.points`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/handlers/seller_backed/points/config.json",
  "title": "Seller-Backed Points Configuration",
  "type": "object",
  "required": ["merchant_id", "psp", "display_name"],
  "properties": {
    "merchant_id": {
      "type": "string",
      "maxLength": 256
    },
    "psp": {
      "type": "string"
    },
    "display_name": {
      "type": "string",
      "maxLength": 128
    },
    "display_metadata": {
      "type": "object",
      "properties": {
        "balance": {
          "type": "integer",
          "description": "Points balance"
        },
        "balance_display": {
          "type": "string",
          "description": "Formatted display of balance with value"
        },
        "conversion_rate": {
          "type": "string",
          "description": "Points to currency conversion rate"
        }
      }
    }
  }
}
```

### 5.5 Store Credit Config Schema

**Handler Name**: `dev.acp.seller_backed.store_credit`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/handlers/seller_backed/store_credit/config.json",
  "title": "Seller-Backed Store Credit Configuration",
  "type": "object",
  "required": ["merchant_id", "psp", "display_name"],
  "properties": {
    "merchant_id": {
      "type": "string",
      "maxLength": 256
    },
    "psp": {
      "type": "string"
    },
    "display_name": {
      "type": "string",
      "maxLength": 128
    },
    "display_metadata": {
      "type": "object",
      "properties": {
        "balance": {
          "type": "integer",
          "description": "Store credit balance in minor currency units"
        },
        "balance_display": {
          "type": "string",
          "description": "Formatted display of balance"
        },
        "currency": {
          "type": "string",
          "pattern": "^[a-z]{3}$"
        }
      }
    }
  }
}
```

### 5.6 Payment Instrument Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/handlers/seller_backed/config.json",
  "title": "Seller-Backed Handler Configuration",
  "type": "object",
  "required": ["merchant_id", "psp", "options"],
  "properties": {
    "merchant_id": {
      "type": "string",
      "description": "Seller's merchant identifier",
      "maxLength": 256
    },
    "psp": {
      "type": "string",
      "description": "Payment service provider (typically 'seller_managed')"
    },
    "options": {
      "type": "array",
      "description": "Available seller-backed payment options",
      "items": {
        "$ref": "#/$defs/PaymentOption"
      },
      "minItems": 1
    }
  },
  "$defs": {
    "PaymentOption": {
      "type": "object",
      "required": ["id", "type", "display_name"],
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique identifier for this option"
        },
        "type": {
          "type": "string",
          "enum": ["saved_card", "points", "gift_card", "store_credit"]
        },
        "display_name": {
          "type": "string",
          "description": "Human-readable name shown to user"
        },
        "display_metadata": {
          "type": "object",
          "description": "Additional display information (brand, balance, etc.)"
        },
        "required_fields": {
          "type": "array",
          "description": "Fields requiring user input",
          "items": {
            "$ref": "#/$defs/RequiredField"
          }
        }
      }
    },
    "RequiredField": {
      "type": "object",
      "required": ["name", "label", "type", "required"],
      "properties": {
        "name": {
          "type": "string",
          "description": "Field identifier"
        },
        "label": {
          "type": "string",
          "description": "Display label for user"
        },
        "type": {
          "type": "string",
          "enum": ["text", "number"],
          "description": "Input field type"
        },
        "required": {
          "type": "boolean"
        },
        "pattern": {
          "type": "string",
          "description": "Regex validation pattern"
        },
        "placeholder": {
          "type": "string"
        },
        "secure": {
          "type": "boolean",
          "description": "Whether to mask input (for PINs)"
        },
        "description": {
          "type": "string",
          "description": "Help text for user"
        }
      }
    }
  }
}
```

### 5.2 Payment Instrument Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/handlers/seller_backed/instrument.json",
  "title": "Seller-Backed Payment Instrument",
  "allOf": [
    { "$ref": "https://acp.dev/schemas/payment_instrument.json" },
    {
      "type": "object",
      "properties": {
        "type": {
          "const": "seller_backed"
        },
        "credential": {
          "oneOf": [
            { "$ref": "https://acp.dev/schemas/credentials/spt.json" }
          ]
        }
      }
    }
  ]
}
```

---

## 6. Security Considerations

### 6.1 Required Delegation

All seller-backed payment options MUST flow through `delegate_payment`:
- ✅ Creates audit trail of payment attempts
- ✅ Enables refund/dispute visibility for agents
- ✅ Provides standardized observability metrics
- ✅ Maintains allowance constraint enforcement

**Important**: The `delegate_payment` call for seller-backed handlers is for tokenization and audit purposes only. Since no credentials are being vaulted, this operation should not fail from the delegation service perspective. Any validation failures (insufficient balance, invalid gift card) occur at checkout completion on the seller's backend.

### 6.2 No Credential Transfer

This handler pattern requires **zero credential transfer**:
- Saved cards: Agent sends handler_id back to the seller in the complete request so the seller knows which option the user chose; seller resolves handler_id to the internal payment method
- Points/store credit: No credentials involved, purely account-based; agent sends handler_id back so seller knows which option was chosen
- Gift cards: User-provided data flows through tokenization, seller validates on their backend; agent sends handler_id back so seller knows which option was chosen

**Key Security Benefit**: Agents never handle or store seller-managed credentials, eliminating PCI compliance requirements for agent infrastructure.

### 6.3 User-Specific Handlers

Sellers MUST only declare handler instances that:
- Are available to the authenticated user
- Have sufficient balance for the transaction (for points/store credit)
- Are valid and not expired

### 6.4 PCI Compliance

All seller-backed handlers have `requires_pci_compliance: false` because:
- Saved cards: Seller already has credentials; agent passes handler_id (so seller knows which option was chosen) and tokenized reference (SPT)
- Points/store credit: No PCI-sensitive data involved; agent passes handler_id back so seller knows which option was chosen
- Gift cards: User inputs flow through tokenization; seller validates on their backend; agent passes handler_id back so seller knows which option was chosen

Sellers MUST handle any sensitive data (gift card numbers, PINs) securely on their backend according to their compliance requirements.

---

## 7. Use Cases

### 7.1 Saved Payment Methods

Sellers with their own payment infrastructure can enable customers to use payment methods saved in their seller accounts during agent-facilitated checkout:
- Seller declares one handler instance per saved payment method
- Agent displays handlers using seller-provided display names
- User selects, agent tokenizes via delegate_payment
- Seller receives complete request with handler_id and token; uses handler_id to identify which saved method to charge and token for audit
- If 3DS required: Agent handles authentication via delegate_authentication flow

### 7.2 Loyalty Points Redemption

Customer uses accumulated rewards points:
- Seller declares points handler only if user balance is sufficient for purchase
- Agent displays points balance and equivalent value from display_metadata
- User selects points handler
- Agent tokenizes via delegate_payment
- Seller deducts points after receiving payment token

### 7.3 Gift Card Application

User applies a gift card at checkout:
- Seller declares gift_card handler with required input fields
- User selects gift card handler
- Agent prompts for card details based on required_fields
- User inputs details (e.g., 16-digit card number, 4-digit PIN)
- Agent tokenizes gift card data via delegate_payment
- Seller validates and applies gift card balance on their backend

---

## 8. Agent Implementation Guidelines

### 8.1 Display Requirements

Agents MUST:
- Display `display_name` exactly as provided by seller (max 128 characters)
- Seller is responsible for ensuring display names are recognizable to users

Agents SHOULD:
- Display seller-backed options distinctly from network payment methods
- Use `display_metadata` for additional context (tooltips, secondary text)
- For saved cards with `display_metadata`, show brand and last4 if provided
- Show seller context when appropriate

### 8.2 User Input Collection

For handlers with `required_fields` in config:
1. Present input form with fields in order
2. Apply validation patterns client-side
3. Mark secure fields (PINs) with masked input
4. Show field descriptions as help text
5. Validate all required fields before proceeding

### 8.3 Authentication Handling

For saved_card handlers with `supports_3ds: true`:
- Seller may require 3DS authentication during payment processing
- Agent handles authentication via `delegate_authentication` endpoint
- Standard ACP authentication flow applies (challenge, verification, completion)

---

## 9. Seller Implementation Guidelines

### 9.1 Option Selection

Only include handlers that are:
- **User-specific**: Don't include another user's saved payment methods
- **Sufficient**: For points/store credit, only include if balance ≥ purchase amount
- **Valid**: Check expiration, active status, etc.

### 9.2 Token Resolution

When receiving the complete request at checkout:
1. Read `handler_id` from `payment_data` to identify which payment option the user chose (this is the same id the seller declared in `capabilities.payment.handlers`)
2. Use the credential token in the instrument for audit/observability
3. For saved cards/points: resolve handler_id to internal payment method and process
4. For gift cards: extract user-provided fields from token, validate and apply balance
5. Process payment using seller's backend systems and return appropriate success/error response

### 9.3 Post-Checkout Events

Sellers SHOULD report post-checkout events back to agent:
- Refunds
- Disputes
- Balance adjustments

This maintains agent visibility into payment lifecycle.

---

## 10. Extensibility

The `dev.acp.seller_backed` pattern is extensible beyond the four handler types defined in this RFC. Sellers can define custom extensions for additional seller-managed payment options following the same base pattern:

- `dev.acp.seller_backed.{custom_type}` - Any seller-managed payment option
- Same requirements: `requires_delegate_payment: true`, `requires_pci_compliance: false`
- Same flow: declaration → selection → tokenization → resolution

### 10.1 Out of Scope

**Partial Payments**: The ability to split payments across multiple handlers (e.g., "use $50 from points + $30 from card") is intentionally excluded from this RFC to manage complexity. This may be addressed in a future specification.

---

## 11. Backward Compatibility

This specification is **backward compatible**. It adds a new handler type (`dev.acp.seller_backed` and its extensions) within the existing `capabilities.payment.handlers` array. No schema or API contract changes are required: the `Payment` and `PaymentHandler` definitions in the 2026-01-30 Agentic Checkout schema already support arbitrary handler names and configs. Existing agents and sellers that do not implement seller-backed payment simply ignore or omit these handlers. Including seller-backed payment handlers in 2026-01-30 examples is therefore **additive** and does not break the version contract.

---

## 12. References

- [RFC: Payment Handlers Framework](./rfc.payment_handlers.md)
- [RFC: Delegate Payment](./rfc.delegate_payment.md)
- [RFC: Agentic Checkout](./rfc.agentic_checkout.md)
- [Agentic Checkout JSON Schema](../spec/2026-01-30/json-schema/schema.agentic_checkout.json) — `Capabilities`, `Payment`, `PaymentHandler`, `PaymentData`
- [Agentic Checkout OpenAPI](../spec/2026-01-30/openapi/openapi.agentic_checkout.yaml) — `POST /checkout_sessions`, `POST /checkout_sessions/{checkout_session_id}/complete`
