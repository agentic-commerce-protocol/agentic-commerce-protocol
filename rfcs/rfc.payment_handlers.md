# RFC: Agentic Commerce — Payment Handlers

**Status:** Draft  
**Version:** 2026-01-22  
**Scope:** Payment handler framework for standardized payment method integration and credential delegation

This RFC introduces a **payment handler framework** for ACP that enables standardized, extensible payment method integration. Payment handlers consolidate payment method capabilities, credential flows, and security controls into a unified discovery and negotiation mechanism.

**Dependencies:**
- ✅ **None** - This RFC is standalone and can be merged independently
- ✅ **Delegate Payment RFC**: Preserved and integrated with PSP identification

---

## 1. Motivation

As agentic commerce evolves, the ecosystem benefits from standardized ways to integrate diverse payment methods—from traditional cards to digital wallets, agentic tokens, and emerging payment types.

Payment handlers extend ACP's payment method foundation by:

1. **Unifying payment methods and capabilities**: Each handler fully describes a payment method including configuration, credential schemas, and requirements
2. **Standardizing delegation**: Handlers explicitly declare whether credential delegation is required, recommended, or optional
3. **Enabling extensibility**: New payment methods can be added without protocol changes by defining new handler specifications
4. **Supporting diverse tokenization flows**: Handlers accommodate different token types (agentic tokens, network tokens, vault tokens)
5. **Making security explicit**: Handlers declare PCI compliance requirements and delegation preferences upfront

Payment handlers enable agents and sellers to discover and negotiate payment method capabilities before checkout, with explicit security requirements and clear PSP identification.

---

## 2. Goals and Non-Goals

### 2.1 Goals

1. **Unified payment method framework**: Replace simple payment method identifiers with rich handler declarations
2. **Explicit delegation semantics**: Make credential delegation requirements clear and enforceable at the handler level
3. **Provider flexibility**: Support clear PSP identification and credential management
4. **Tokenized payment integration**: Enable standardized integration of tokenizable payment methods (cards, bank accounts, etc.)
5. **Security by default**: Make `delegate_payment` the recommended approach while allowing handlers to opt out when appropriate
6. **Forward compatibility**: Enable new payment methods through handler specifications without protocol changes

### 2.2 Non-Goals

- Defining specific handler implementations (covered in separate handler specification documents)
- Changing the `delegate_payment` API endpoint (endpoint remains as-is)
- Backward compatibility with the current payment_methods array (this is a breaking change)
- Standardizing PSP-specific APIs or token formats
- Creating a centralized handler registry (handlers are discovered per-session)

---

## 3. Design Rationale

### 3.1 Why consolidate payment_methods into handlers?

The current `payment_methods` array in `capabilities` provides limited information:

```json
"payment_methods": ["card", "card.agentic_token"]
```

This approach cannot express:
- Configuration needed to use each method (merchant IDs, network identifiers)
- Credential schemas and requirements
- Whether delegation is required
- PSP-specific constraints
- Environment settings (sandbox vs production)

Payment handlers address these limitations by making each payment method a **rich, self-describing object** with configuration, schemas, and security requirements.

### 3.2 Why handlers, not just enhanced payment methods?

The term "handler" reflects that each payment method defines:
- How to **handle** credential acquisition (agent's responsibility)
- How to **handle** credential processing (seller's responsibility)  
- How to **handle** delegation and security
- Complete **handler** specifications that can evolve independently

This aligns with industry patterns (EMVCo, payment networks) where payment methods are implemented as handlers with defined behaviors.

### 3.3 Why require delegate_payment by default?

The `delegate_payment` endpoint provides critical security properties:
- **Allowance constraints**: Clear limits on amount, currency, expiry
- **Risk signals**: Standardized risk assessment data
- **Token lifecycle**: Explicit creation, binding, and expiry
- **Auditability**: Clear separation of credential vault from payment processing

Making `delegate_payment` the **recommended default** (via `requires_delegate_payment: true`) ensures these properties are preserved while allowing handlers to opt out when the pattern doesn't fit (e.g., certain wallet flows where the wallet provider's token already embeds these constraints).

### 3.4 Handler as specification + instance

Each payment handler serves dual roles:

1. **Specification**: A documented standard (e.g., "dev.acp.tokenized.card") defining schemas, flows, and requirements
2. **Instance**: A seller's specific configuration for that handler (merchant IDs, accepted networks, environment settings)

This duality enables:
- Agents to implement handler specifications once and work with any seller supporting that handler
- Sellers to advertise their specific configuration for each handler
- The ecosystem to add new handlers without protocol changes

---

## 4. Terminology

### 4.1 Core Concepts

**Payment Handler**: A specification and configuration for a payment method, including:
- Unique identifier (specification name in reverse-DNS format)
- Configuration schema (what sellers must provide)
- Instrument schema (what agents submit at checkout)
- Credential schema (payment data structure)
- Delegation requirements
- Processing requirements

**Handler Specification**: The documented standard for a handler (e.g., "dev.acp.tokenized.card"), typically hosted at a public URL, defining all schemas and flows.

**Handler Instance**: A seller's specific configuration of a handler, advertised in `capabilities.payment.handlers[]`.

**Handler ID**: A unique identifier for a handler instance within a checkout session (e.g., "gpay_main", "card_stripe").

**Payment Instrument**: The complete payment data submitted by an agent, conforming to a handler's instrument schema.

**Credential**: The sensitive payment data within an instrument (e.g., card number, wallet token, vault token).

**Delegation**: The process of using the `delegate_payment` endpoint to vault credentials and obtain a token with allowance constraints.

### 4.2 Terminology Clarifications

| ACP Term | Also Known As | Description |
|----------|---------------|-------------|
| Seller | Business / Merchant | Party accepting payment |
| Seller Platform | Platform | Infrastructure/system that sellers use for commerce (e.g., Shopify) |
| PSP | Payment Service Provider | Service processing payment transactions (e.g., Stripe, Adyen) |
| Agent | Facilitator / Orchestrator | Party orchestrating checkout on behalf of user |
| Payment Handler | Payment Method Handler | Specification + configuration for payment method |
| Handler Instance | Handler Declaration | Seller's advertised handler config |
| Requires Delegation | Delegation Requirement | Whether delegate_payment must be used |

---

## 5. Handler Structure

### 5.1 Handler Declaration (in capabilities)

Each handler in `capabilities.payment.handlers[]` follows this structure:

```json
{
  "id": "handler_instance_id",
  "name": "reverse.dns.format",
  "version": "YYYY-MM-DD",
  "spec": "https://example.com/handler-spec",
  "requires_delegate_payment": true,
  "requires_pci_compliance": false,
  "psp": "stripe",
  "config_schema": "https://example.com/config-schema.json",
  "instrument_schemas": ["https://example.com/instrument-schema.json"],
  "config": {
    // Handler-specific configuration
  }
}
```

**Field Definitions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier for this handler instance within the session. Used by payment instruments to reference which handler they conform to. |
| `name` | string | ✅ | Handler specification name in reverse-DNS format (e.g., `dev.acp.tokenized.card`). |
| `version` | string | ✅ | Handler specification version in YYYY-MM-DD format. |
| `spec` | URI | ✅ | URL to human-readable handler specification document. |
| `requires_delegate_payment` | boolean | ✅ | Whether this handler requires use of the `/agentic_commerce/delegate_payment` endpoint. **RECOMMENDED: `true`** for all handlers to ensure explicit allowance constraints and secure credential handling. |
| `requires_pci_compliance` | boolean | ✅ | Whether this handler processes PCI DSS sensitive data. **RECOMMENDED: `false`**. Handlers SHOULD leverage tokenization to avoid passing PCI-sensitive data. If set to `true`, Seller can route requests to PCI-compliant infrastructure. **Default: `false`**. |
| `psp` | string | ✅ | Payment Service Provider identifier (e.g., `stripe`, `adyen`, `braintree`). Tells Agent which PSP the Seller uses for payment processing. |
| `config_schema` | URI | ✅ | URL to JSON Schema for validating the `config` object. |
| `instrument_schemas` | array of URIs | ✅ | URLs to JSON Schemas defining valid payment instrument structures for this handler. |
| `config` | object | ✅ | Handler-specific configuration (structure validated by `config_schema`). |

### 5.2 Payment Instrument Structure

All payment instruments extend this base schema:

```json
{
  "id": "instrument_id",
  "handler_id": "handler_instance_id",
  "type": "handler_specific_type",
  "credential": {
    // Credential structure defined by handler
  }
}
```

**Base Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier for this instrument instance, assigned by the Agent. |
| `handler_id` | string | ✅ | References the `id` of the handler that produced this instrument. |
| `type` | string | ✅ | Payment instrument type identifier (defined by handler specification). |
| `credential` | object | ✅ | Credential payload (structure defined by handler's credential schema). |

**Note**: Handlers that require billing address (e.g., for AVS checks) can specify `billing_address` as an additional field in their instrument schema. The `delegate_payment` API accepts `billing_address` when vaulting credentials that require it.

### 5.3 Handler Discovery Flow

```
1. Agent → POST /checkout_sessions
   {
     "cart": { ... },
     "customer": { ... }
   }

2. Seller → Response with payment handlers
   {
     "payment": {
       "handlers": [
         {
           "id": "card_tokenized",
           "name": "dev.acp.tokenized.card",
           "requires_delegate_payment": true,
           "config": { 
             "accepted_types": ["card"],
             "accepted_brands": ["visa", "mastercard"] 
           }
         },
         {
           "id": "link_checkout",
           "name": "dev.acp.tokenized.card",
           "requires_delegate_payment": true,
           "config": { "merchant_id": "...", "psp": "stripe" }
         }
       ]
     }
   }

3. Agent discovers available handlers and their configurations

4. Agent acquires payment credential (via user input, wallet, etc.)

5. **Delegation**: Agent calls `POST /delegate_payment` with credential and allowance
   ```json
   {
     "handler_id": "card_tokenized",
     "credential": { 
       "type": "agentic_token",
       "token": "tok_visa_abc123",
       "network": "visa",
       "last4": "4242"
     },
     "allowance": {
       "max_amount": 10000,
       "currency": "usd",
       "merchant_id": "acct_1234567890",  // From handler config
       "checkout_session_id": "cs_abc123"
     }
   }
   // Response: Shared Payment Token (SPT)
   {
     "id": "vt_01J8Z3WXYZ9ABC",
     "type": "spt",
     "allowance": { /* ... */ }
   }
   ```

6. **Payment**: Agent submits payment instrument with SPT referencing handler
   ```json
   {
     "payment_data": {
       "handler_id": "card_tokenized",
       "instrument": {
         "id": "inst_123",
         "handler_id": "card_tokenized",
         "type": "card",
         "credential": {
           "type": "spt",
           "token": "vt_01J8Z3WXYZ9ABC"  // SPT from delegate_payment
         }
       }
     }
   }
   ```

7. **Completion**: Seller processes payment using handler configuration and SPT
```

---

## 6. Relationship with delegate_payment

### 6.1 The `requires_delegate_payment` Field

Each handler declares whether credential delegation is required:

**`requires_delegate_payment: true`** (RECOMMENDED)
- Agent **MUST** call `/agentic_commerce/delegate_payment` before checkout completion
- Agent submits the vault token in the payment instrument's credential
- Seller uses vault token with their PSP to charge payment
- Provides allowance constraints, risk signals, and security guarantees

### 6.2 Why Delegation is Recommended

Regardless of `requires_delegate_payment` setting, using the `delegate_payment` endpoint provides:

1. **Explicit allowance bounds**: `max_amount`, `currency`, `expires_at`, `checkout_session_id`
2. **Risk signal standardization**: Consistent risk data format across payment methods
3. **Credential scoping**: Tokens bound to specific checkout sessions and merchants
4. **Audit trail**: Clear record of credential creation and usage
5. **Security separation**: Vault infrastructure separate from payment processing

Handlers SHOULD set `requires_delegate_payment: true` to ensure explicit allowance constraints and secure credential handling.

### 6.3 delegate_payment API Integration

The existing `/agentic_commerce/delegate_payment` endpoint defined in the Delegate Payment RFC remains unchanged. Payment handlers provide the configuration needed for proper `delegate_payment` calls.

**Handler Config → delegate_payment Flow**:

```json
// Step 1: Seller provides handler with merchant_id in config
{
  "payment": {
    "handlers": [
      {
        "id": "card_tokenized",
        "name": "dev.acp.tokenized.card",
        "requires_delegate_payment": true,
        "psp": "stripe",
        "config": {
          "merchant_id": "acct_1234567890",  // ← Required for delegate_payment
          "accepted_brands": ["visa", "mastercard"]
        }
      }
    ]
  }
}

// Step 2: Agent extracts merchant_id from handler config and calls delegate_payment
POST /agentic_commerce/delegate_payment
{
  "payment_method": {
    "type": "card",
    "card_number_type": "network_token",
    "number": "tok_visa_abc123",
    "exp_month": "12",
    "exp_year": "2027",
    "display_last4": "4242",
    "display_brand": "visa",
    "display_card_funding_type": "credit",
    "virtual": false,
    "metadata": {}
  },
  "allowance": {
    "reason": "one_time",
    "max_amount": 10000,
    "currency": "usd",
    "checkout_session_id": "cs_abc123",
    "merchant_id": "acct_1234567890",  // ← From handler config
    "expires_at": "2026-01-22T18:00:00Z"
  },
  "risk_signals": [
    {
      "type": "card_testing",
      "score": 95,
      "action": "authorized"
    }
  ],
  "metadata": {
    "handler_id": "card_tokenized",
    "checkout_session_id": "cs_abc123"
  }
}

// Step 3: Response with Shared Payment Token (SPT)
{
  "id": "vt_01J8Z3WXYZ9ABC",
  "object": "delegated_payment_token",
  "created": 1672531200,
  "type": "card",
  "allowance": {
    "reason": "one_time",
    "max_amount": 10000,
    "currency": "usd",
    "checkout_session_id": "cs_abc123",
    "merchant_id": "acct_1234567890",
    "expires_at": "2026-01-22T18:00:00Z"
  },
  "metadata": {
    "handler_id": "card_tokenized",
    "checkout_session_id": "cs_abc123",
    "merchant_id": "acct_1234567890"
  }
}
```

**Key Integration Points**:

1. **`merchant_id` is REQUIRED** in handler `config` for all handlers using `delegate_payment`
2. Agent extracts `merchant_id` from handler config and includes it in the `allowance` object
3. PSP uses `merchant_id` to properly scope vault tokens and route payments
4. All handler-specific metadata flows through `delegate_payment` for audit trails

### 6.4 PSP Declaration and Credential Vaulting

The `psp` field in handler declarations tells Agents which PSP the Seller uses:

```json
{
  "id": "card_tokenized",
  "name": "dev.acp.tokenized.card",
  "psp": "stripe",  // Seller uses Stripe
  "config": {
    "merchant_id": "acct_1234567890"
  }
}
```

**Credential Vaulting Flow**:
1. Agent sees handler has `psp: "stripe"` and `merchant_id: "acct_1234567890"`
2. Agent calls `delegate_payment` with the Seller's PSP (Stripe) using the merchant_id
3. PSP (Stripe) creates vault token (SPT) scoped to the Seller's merchant account
4. Agent submits SPT to Seller
5. Seller unwraps and uses the SPT with their PSP (Stripe)

**Why this matters**:
- Agent knows which PSP to call for credential vaulting
- Vault token (SPT) is created by the correct PSP and scoped to the correct merchant
- No ambiguity about which PSP infrastructure will process the payment

---

## 7. Handler Types Overview

This framework supports multiple handler integration patterns based on credential types and tokenization strategies:

### 7.1 Base Pattern: `dev.acp.tokenized`

**Purpose**: Foundation for tokenizable/vaultable payment methods

**Credential Types**:
- **Agentic Tokens**: MC/Visa tokens specifically designed for agentic commerce
- **Card Tokens**: Credit/debit cards via network tokenization
- **ACH Tokens**: Tokenized bank account credentials
- **Other tokenizable payment methods**: Any payment method that can be vaulted and tokenized

**Flow**:
1. Agent acquires tokenizable credential (agentic token, card, ACH, etc.)
2. Agent calls `delegate_payment` with credential + allowance
3. PSP creates vault token (SPT) with allowance constraints
4. Agent submits vault token to Seller
5. Seller uses vault token with PSP to unwrap and charge

**Handler Names**:
- `dev.acp.tokenized` — Base pattern (abstract, defines tokenization protocol)
- `dev.acp.tokenized.card` — Card tokenization (ACP reference implementation)
- `dev.acp.tokenized.ach` — ACH tokenization (open for extension)
- `dev.acp.tokenized.bank_transfer` — Bank transfers (open for extension)

**`requires_delegate_payment`**: `true`

**`requires_pci_compliance`**: `false` (handlers use tokenized credentials, not raw PCI-sensitive data)

**`psp`**: Seller's PSP identifier (e.g., `"stripe"`, `"adyen"`)

**PSP Declaration**:
- Agent uses this to know which PSP to call for `delegate_payment`
- Vault token (SPT) is created by the Seller's PSP
- Agent vaults credentials with the correct PSP infrastructure

**Key Properties**:
- Allowance enforcement by PSP
- Risk signals included in delegation
- Single-use tokens with checkout binding
- Test mode support

### 7.2 Tokenization Standards

All handlers leverage tokenization to secure credentials:

| Token Type | Description | Scope | Example Handler Types |
|------------|-------------|-------|----------------------|
| **SPT (Shared Payment Token)** | ACP's standardized delegation token | Cross-agent, cross-seller | All handlers when `requires_delegate_payment: true` |
| **Agentic Token** | MC/Visa tokens for agentic commerce | Network-scoped | Tokenized handlers |

**SPT as Universal Wrapper**:
- SPT can wrap any underlying token type
- Provides consistent allowance constraints across payment methods
- Enables standardized unwrapping at Seller's PSP
- Facilitates PSP-aware routing via header metadata

---

## 8. Example Handler Declarations

### 8.1 Card Tokenization Handler (Delegated, Same-PSP)

```json
{
  "id": "card_tokenized",
  "name": "dev.acp.tokenized.card",
  "version": "2026-01-22",
  "spec": "https://acp.dev/specs/handlers/card",
  "requires_delegate_payment": true,
  "requires_pci_compliance": false,
  "config_schema": "https://acp.dev/schemas/handlers/card/config.json",
  "instrument_schemas": [
    "https://acp.dev/schemas/handlers/card/instrument.json"
  ],
  "config": {
    "merchant_id": "acct_1234567890",
    "accepted_brands": ["visa", "mastercard", "amex"],
    "accepted_funding_types": ["credit", "debit"],
    "psp": "stripe",
    "environment": "production"
  }
}
```

---

## 9. Migration from payment_methods

### 9.1 Breaking Change Notice

This RFC introduces a **breaking change**: `payment_methods[]` is **removed** and **replaced** with `capabilities.payment.handlers[]`.

**Before (simple payment_methods array):**
```json
{
  "payment": {
    "methods": ["card", "card.agentic_token"]
  }
}
```

**After (payment_handlers RFC):**
```json
{
  "capabilities": {
    "payment_handlers": [
      {
        "id": "card_main",
        "name": "dev.acp.tokenized.card",
        "version": "2026-01-22",
        "requires_delegate_payment": true,
        "config": { ... }
      },
      {
        "id": "link_main",
        "name": "com.stripe.link",
        "version": "2026-01-22",
        "requires_delegate_payment": true,
        "config": { ... }
      }
    ],
    "features": { ... }
  }
}
```

### 9.2 Migration Strategy

**For Sellers:**
1. Map each payment method to a handler specification
2. Define handler configuration for each supported method
3. Replace `payment_methods[]` with `capabilities.payment.handlers[]` in responses

**For Agents:**
1. Update session creation logic to parse `capabilities.payment.handlers[]`
2. Implement handler-specific credential acquisition flows
3. Update completion logic to reference handler IDs in payment instruments

---

## 10. JSON Schema Definitions

This section defines the JSON schemas that form the foundation of the payment handlers framework.

### Handler Config Requirements

**All handler configs MUST include:**
- **`merchant_id`** (string, ≤256 chars): Seller's merchant/account identifier with the PSP
  - Required for proper `delegate_payment` API integration
  - Used in the `allowance.merchant_id` field when vaulting credentials
  - Enables PSP to scope vault tokens to correct merchant account
- **`psp`** (string): Payment Service Provider identifier (matches handler-level `psp` field)

**All handler configs SHOULD include (for delegation flows):**
- **`merchant_display_name`** (string): Merchant's display name shown to user (e.g., in wallet payment sheets)
- **`delegate_id`** (string): Agent's registered delegate identifier with the payment provider
- **`delegate_display_name`** (string): Agent's display name shown to user during payment flow

Specific handlers may require additional fields (e.g., `accepted_brands` for `dev.acp.tokenized.card`).

---

### 10.1 Base Handler Schema

**Schema URL**: `https://acp.dev/schemas/payment_handler.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/payment_handler.json",
  "title": "Payment Handler Declaration",
  "description": "Schema for declaring payment handlers in capabilities.payment.handlers",
  "type": "object",
  "required": ["id", "name", "version", "spec", "requires_delegate_payment", "requires_pci_compliance", "psp", "config_schema", "instrument_schemas", "config"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for this handler instance within the session",
      "pattern": "^[a-zA-Z0-9_-]+$",
      "minLength": 1,
      "maxLength": 64
    },
    "name": {
      "type": "string",
      "description": "Handler specification name in reverse-DNS format",
      "pattern": "^[a-z][a-z0-9]*(?:\\.[a-z][a-z0-9_]*)+$",
      "examples": ["dev.acp.tokenized.card"]
    },
    "version": {
      "type": "string",
      "description": "Handler specification version in YYYY-MM-DD format",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "examples": ["2026-01-22"]
    },
    "spec": {
      "type": "string",
      "format": "uri",
      "description": "URL to human-readable handler specification document"
    },
    "requires_delegate_payment": {
      "type": "boolean",
      "description": "Whether this handler requires use of delegate_payment endpoint",
      "default": true
    },
    "requires_pci_compliance": {
      "type": "boolean",
      "description": "Whether this handler processes PCI DSS sensitive data",
      "default": false
    },
    "psp": {
      "type": "string",
      "description": "Payment Service Provider identifier",
      "examples": ["stripe", "adyen", "braintree", "checkout"],
      "minLength": 1
    },
    "config_schema": {
      "type": "string",
      "format": "uri",
      "description": "URL to JSON Schema for validating handler config"
    },
    "instrument_schemas": {
      "type": "array",
      "description": "URLs to JSON Schemas for valid payment instruments",
      "items": {
        "type": "string",
        "format": "uri"
      },
      "minItems": 1
    },
    "config": {
      "type": "object",
      "description": "Handler-specific configuration validated by config_schema"
    }
  },
  "additionalProperties": false
}
```

### 10.2 Base Payment Instrument Schema

**Schema URL**: `https://acp.dev/schemas/payment_instrument.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/payment_instrument.json",
  "title": "Payment Instrument Base",
  "description": "Base schema for all payment instruments submitted at checkout",
  "type": "object",
  "required": ["id", "handler_id", "type", "credential"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for this instrument instance, assigned by Agent",
      "pattern": "^[a-zA-Z0-9_-]+$",
      "minLength": 1,
      "maxLength": 128
    },
    "handler_id": {
      "type": "string",
      "description": "References the handler.id that produced this instrument",
      "pattern": "^[a-zA-Z0-9_-]+$"
    },
    "type": {
      "type": "string",
      "description": "Payment instrument type identifier defined by handler",
      "examples": ["card", "wallet", "bnpl", "agentic_token"]
    },
    "credential": {
      "type": "object",
      "description": "Credential payload (structure defined by handler's credential schema)"
    },
    "metadata": {
      "type": "object",
      "description": "Optional key-value metadata",
      "additionalProperties": {
        "type": "string"
      }
    }
  },
  "additionalProperties": true
}
```

**Note**: `additionalProperties: true` allows handlers to extend the base schema with additional fields (e.g., `billing_address` for `dev.acp.tokenized.card` that requires AVS checks).

### 10.3 Base Credential Schemas

#### 10.3.1 SPT (Shared Payment Token) Credential

**Schema URL**: `https://acp.dev/schemas/credentials/spt.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/credentials/spt.json",
  "title": "Shared Payment Token Credential",
  "description": "Credential structure for SPT (vault token from delegate_payment)",
  "type": "object",
  "required": ["type", "token"],
  "properties": {
    "type": {
      "type": "string",
      "const": "spt",
      "description": "Credential type identifier"
    },
    "token": {
      "type": "string",
      "description": "Vault token ID returned from delegate_payment",
      "pattern": "^vt_[a-zA-Z0-9]+$",
      "examples": ["vt_01J8Z3WXYZ9ABC"]
    },
    "allowance": {
      "type": "object",
      "description": "Optional allowance metadata (redundant with token, for reference)",
      "properties": {
        "max_amount": {
          "type": "integer",
          "description": "Maximum amount in minor units"
        },
        "currency": {
          "type": "string",
          "pattern": "^[a-z]{3}$"
        },
        "expires_at": {
          "type": "string",
          "format": "date-time"
        }
      }
    }
  },
  "additionalProperties": false
}
```

#### 10.3.2 Agentic Token Credential

**Schema URL**: `https://acp.dev/schemas/credentials/agentic_token.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/credentials/agentic_token.json",
  "title": "Agentic Token Credential",
  "description": "Credential structure for MC/Visa agentic tokens",
  "type": "object",
  "required": ["type", "token"],
  "properties": {
    "type": {
      "type": "string",
      "const": "agentic_token",
      "description": "Credential type identifier"
    },
    "token": {
      "type": "string",
      "description": "Agentic token from card network",
      "minLength": 13,
      "maxLength": 19
    },
    "network": {
      "type": "string",
      "description": "Card network that issued the token",
      "enum": ["visa", "mastercard"],
      "examples": ["visa", "mastercard"]
    },
    "last4": {
      "type": "string",
      "description": "Last 4 digits of underlying card",
      "pattern": "^\\d{4}$"
    },
    "exp_month": {
      "type": "string",
      "pattern": "^(0[1-9]|1[0-2])$"
    },
    "exp_year": {
      "type": "string",
      "pattern": "^\\d{4}$"
    }
  },
  "additionalProperties": false
}
```

### 10.4 Handler-Specific Schemas

#### 10.4.1 Card Tokenization Handler Config Schema

**Handler Name**: `dev.acp.tokenized.card`

**Schema URL**: `https://acp.dev/schemas/handlers/tokenized.card/config.json`

**Description**: ACP reference implementation for card tokenization supporting agentic tokens, network tokens, and traditional card payments.

**Configuration Requirements**:
- `merchant_id`: Seller's account identifier with their PSP (e.g., `acct_1234567890` for Stripe)
- `psp`: Which PSP the Seller uses (e.g., `stripe`, `adyen`)
- These fields enable proper credential vaulting and token scoping

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/handlers/tokenized.card/config.json",
  "title": "Card Tokenization Handler Configuration",
  "description": "Configuration schema for dev.acp.tokenized.card handler",
  "type": "object",
  "required": ["merchant_id", "psp", "accepted_brands"],
  "properties": {
    "merchant_id": {
      "type": "string",
      "description": "Seller's merchant/account identifier with the PSP. Required for delegate_payment API calls.",
      "maxLength": 256,
      "examples": ["acct_1234567890", "merchant_xyz789"]
    },
    "psp": {
      "type": "string",
      "description": "Payment Service Provider identifier - tells Agent which PSP the Seller uses",
      "examples": ["stripe", "adyen", "braintree", "checkout"],
      "minLength": 1
    },
    "accepted_brands": {
      "type": "array",
      "description": "Card brands accepted by this handler",
      "items": {
        "type": "string",
        "enum": ["visa", "mastercard", "amex", "discover", "diners", "jcb", "unionpay"]
      },
      "minItems": 1,
      "uniqueItems": true
    },
    "accepted_funding_types": {
      "type": "array",
      "description": "Card funding types accepted",
      "items": {
        "type": "string",
        "enum": ["credit", "debit", "prepaid"]
      },
      "uniqueItems": true
    },
    "supports_3ds": {
      "type": "boolean",
      "description": "Whether 3DS authentication is supported",
      "default": true
    },
    "3ds_versions": {
      "type": "array",
      "description": "Supported 3DS protocol versions",
      "items": {
        "type": "string",
        "enum": ["2.1", "2.2", "2.3"]
      },
      "default": ["2.2"]
    },
    "environment": {
      "type": "string",
      "enum": ["sandbox", "production"],
      "description": "Environment for this handler instance"
    }
  },
  "additionalProperties": false
}
```

**Example Configuration**:
```json
{
  "id": "card_primary",
  "name": "dev.acp.tokenized.card",
  "version": "2026-01-22",
  "spec": "https://acp.dev/handlers/tokenized.card/v2026-01-22",
  "requires_delegate_payment": true,
  "requires_pci_compliance": false,
  "psp": "stripe",
  "config_schema": "https://acp.dev/schemas/handlers/tokenized.card/config.json",
  "instrument_schemas": ["https://acp.dev/schemas/handlers/tokenized.card/instrument.json"],
  "config": {
    "merchant_id": "acct_1234567890",
    "psp": "stripe",
    "accepted_brands": ["visa", "mastercard", "amex", "discover"],
    "accepted_funding_types": ["credit", "debit"],
    "supports_3ds": true,
    "3ds_versions": ["2.2", "2.3"],
    "environment": "production"
  }
}
```

### 10.5 Schema Extension Pattern

All handler-specific schemas follow this extension pattern:

```json
{
  "allOf": [
    { "$ref": "https://acp.dev/schemas/payment_instrument.json" },
    {
      "type": "object",
      "properties": {
        "type": { "const": "handler_specific_type" },
        "credential": { "$ref": "handler_credential_schema.json" }
      }
    }
  ]
}
```

**Example - Card Instrument Schema:**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.dev/schemas/handlers/card/instrument.json",
  "title": "Card Payment Instrument",
  "allOf": [
    { "$ref": "https://acp.dev/schemas/payment_instrument.json" },
    {
      "type": "object",
      "properties": {
        "type": {
          "const": "card"
        },
        "credential": {
          "oneOf": [
            { "$ref": "https://acp.dev/schemas/credentials/spt.json" },
            { "$ref": "https://acp.dev/schemas/credentials/agentic_token.json" }
          ]
        },
        "brand": {
          "type": "string",
          "description": "Card brand for display",
          "enum": ["visa", "mastercard", "amex", "discover"]
        },
        "last4": {
          "type": "string",
          "description": "Last 4 digits for display",
          "pattern": "^\\d{4}$"
        },
        "exp_month": {
          "type": "string",
          "pattern": "^(0[1-9]|1[0-2])$"
        },
        "exp_year": {
          "type": "string",
          "pattern": "^\\d{4}$"
        }
      }
    }
  ]
}
```

---

## 11. Change Log

- **2026-01-22**: Initial draft — Foundation and terminology for payment handlers framework, branched from `main`
- **2026-01-22**: Added complete JSON schemas for handlers, instruments, and credentials
- **2026-01-22**: Defined base handler patterns and ACP reference implementation for card tokenization
- **2026-01-22**: Integrated with existing `delegate_payment` API

---
