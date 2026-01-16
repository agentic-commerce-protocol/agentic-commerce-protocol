# SEP: Capability Negotiation — Executive Summary

**Status**: Draft  
**RFC**: [rfcs/rfc.capability_negotiation.md](../rfcs/rfc.capability_negotiation.md)  
**Target Version**: Unreleased  
**Authors**: Protocol Maintainers

---

## Problem

Agents and Sellers currently have no standardized way to communicate their capabilities during checkout, leading to:

- **Failed transactions** when payment methods are incompatible
- **Poor user experience** when authentication requirements can't be satisfied
- **Wasted API calls** discovering incompatibilities after authorization attempts
- **Fragile integrations** requiring out-of-band coordination between parties

---

## Solution

Add bidirectional capability negotiation to the `create_checkout` flow:

1. **Agent declares capabilities** in the checkout session creation request (`agent_capabilities`)
2. **Seller responds with capabilities** in all checkout session responses (`seller_capabilities`)

Both fields are **REQUIRED** when implementing this extension, ensuring predictable behavior.

### What Agents Declare

```json
{
  "agent_capabilities": {
    "interventions": {
      "3ds": {
        "versions": ["2.1", "2.2"],
        "channels": ["browser", "mobile"],
        "flows": ["challenge"]
      },
      "biometric": {
        "types": ["fingerprint", "face_id"],
        "fallback_available": true,
        "metadata": {
          "timeout_seconds": 30
        }
      },
      "otp": {
        "delivery_methods": ["sms"],
        "max_attempts": 3,
        "metadata": {
          "regional_support": "global"
        }
      },
      "email_verification": {},
      "redirect_context": "in_app",
      "display_context": "webview"
    },
    "features": {
      "async_completion": true,
      "session_persistence": true
    }
  }
}
```

### What Sellers Respond With

```json
{
  "seller_capabilities": {
    "payment_methods": [
      {
        "method": "card",
        "brands": ["visa", "mastercard"],
        "funding_types": ["credit", "debit"],
        "providers": ["stripe"]
      },
      "wallet.apple_pay"
    ],
    "interventions": {
      "required": [],
      "3ds": {
        "versions": ["2.1", "2.2", "2.3"],
        "channels": ["browser", "mobile", "3ri"],
        "flows": ["challenge", "frictionless"]
      },
      "email_verification": {
        "methods": ["code", "magic_link"],
        "code_length": 6,
        "link_ttl_seconds": 600,
        "metadata": {
          "custom_domain_support": true
        }
      },
      "enforcement": "conditional"
    },
    "features": {
      "network_tokenization": true,
      "partial_auth": false,
      "saved_payment_methods": true
    }
  }
}
```

---

## Key Design Decisions

### 1. Required Fields (All-In Adoption)

**Decision**: When implementing this extension, both `agent_capabilities` and `seller_capabilities` are **REQUIRED** fields.

**Rationale**:
- Eliminates ambiguity between "field missing" vs "no capabilities"
- Provides strong guarantees for implementations
- Simpler integration logic (no complex "if present, then..." conditionals)
- Clear opt-in model: implement fully or not at all

**Minimum declaration**: Agents can send `{"interventions": {}, "features": {}}` if they have no special capabilities.

### 2. Bidirectional Exchange

**Decision**: Both Agent and Seller declare their capabilities.

**Rationale**:
- Agents need to know what the Seller requires/supports to optimize UX
- Sellers need to know what Agents can handle to set appropriate requirements
- Enables early incompatibility detection before payment authorization
- Supports progressive enhancement based on mutual capabilities

### 3. Hierarchical Payment Methods

**Decision**: Use hierarchical identifiers with optional constraint objects.

**Formats supported**:
```json
// Simple string
"card"

// Object with constraints
{
  "method": "card",
  "brands": ["visa", "mastercard"],
  "funding_types": ["credit", "debit"],
  "providers": ["stripe"]
}
```

**Rationale**:
- Balances simplicity (strings) with specificity (objects)
- Supports card brand/funding type filtering without explosion of identifiers
- Forward-compatible: new fields can be added to objects
- PSP routing information at payment method level (not session level)

### 4. Consolidated Interventions

**Decision**: Merge authentication and intervention capabilities into single `interventions` object.

**Rationale**:
- Reduces confusion between "authentication" vs "intervention"
- All user interactions are fundamentally interventions in the flow
- Simpler schema with fewer nested objects
- Clear bidirectional flow: Seller "raises" interventions, Agent "handles" them

### 5. Structured 3DS Capabilities

**Decision**: Use structured object for 3DS with separate `versions`, `channels`, and `flows` arrays.

```json
{
  "3ds": {
    "versions": ["2.1", "2.2", "2.3"],
    "channels": ["browser", "mobile", "3ri"],
    "flows": ["challenge", "frictionless"]
  }
}
```

**Rationale**:
- Separates orthogonal concepts (version, channel, flow preference)
- Avoids explosion of enum values (3ds, 3ds2, 3ds_redirect, 3ds_challenge, etc.)
- Future-proof for new 3DS versions (2.4, 3.0, etc.)
- Clear semantics: "supports version X via channel Y with flow Z"

### 6. Metadata Extensibility

**Decision**: All intervention types support optional `metadata` field alongside prescriptive structured fields.

```json
{
  "otp": {
    "delivery_methods": ["sms", "voice"],
    "length": 6,
    "ttl_seconds": 300,
    "metadata": {
      "regional_restrictions": ["US", "CA"],
      "carrier_support": "all_major"
    }
  },
  "biometric": {
    "types": ["fingerprint", "face_id"],
    "fallback_available": true,
    "metadata": {
      "timeout_seconds": 30,
      "retry_delay_seconds": 5
    }
  }
}
```

**Rationale**:
- **Prescriptive common fields**: Standardizes most common configuration options
- **Extensible via metadata**: Enables implementation-specific configuration without protocol changes
- **Forward-compatible**: Unknown metadata keys are ignored
- **Balanced approach**: Combines standardization with flexibility
- **Consistent pattern**: All intervention types follow same structure (standard fields + metadata)

### 7. Payment Service Provider at Method Level

**Decision**: Removed top-level `payment_provider` field; added optional `providers` array to payment method objects.

**Rationale**:
- Multi-PSP routing: Sellers can use different PSPs for different payment methods
- Method-specific configuration: Each payment method can declare compatible PSPs
- Cleaner session object: No redundancy with payment method declarations
- Future-proof: Reserved for multi-PSP negotiation without breaking changes

---

## Capability Catalog

### Payment Methods (Seller Only)

Hierarchical identifiers:
- `card` — Generic credit/debit card
- `card.network_token` — Network tokenized card
- `card.digital_wallet` — Card via digital wallet
- `bnpl.{provider}` — Buy Now Pay Later
- `wallet.{provider}` — Digital wallets
- `bank_transfer.{type}` — Bank transfers

Object constraints:
- `brands` — Card networks (visa, mastercard, amex, discover, diners, jcb, unionpay, eftpos, interac)
- `funding_types` — Card types (credit, debit, prepaid)
- `providers` — Payment service providers (e.g., stripe)

### Interventions (Agent and Seller)

**3D Secure** (structured object):
- `versions`: 3DS protocol versions (`2.1`, `2.2`, `2.3`)
- `channels`: Integration channels (`browser`, `mobile`, `3ri`)
- `flows`: Flow types (`challenge`, `frictionless`)
- `metadata`: Implementation-specific configuration

**Biometric** (structured object):
- `types`: Biometric types (`fingerprint`, `face_id`, `face_recognition`, `iris`, `voice`)
- `fallback_available`: Whether fallback auth is available
- `metadata`: Implementation-specific configuration

**OTP** (structured object):
- `delivery_methods`: Delivery methods (`sms`, `voice`, `authenticator_app`)
- `length`: Code length (4-10 digits)
- `ttl_seconds`: Time-to-live in seconds
- `max_attempts`: Maximum verification attempts
- `metadata`: Implementation-specific configuration

**Email Verification** (structured object):
- `methods`: Verification methods (`code`, `magic_link`, `both`)
- `code_length`: Verification code length (4-10 digits)
- `link_ttl_seconds`: Magic link TTL in seconds
- `metadata`: Implementation-specific configuration

**SMS Verification** (structured object):
- `code_length`: Verification code length (4-10 digits)
- `ttl_seconds`: Code time-to-live in seconds
- `max_attempts`: Maximum verification attempts
- `metadata`: Implementation-specific configuration

**Address Verification** (structured object):
- `methods`: Verification methods (`avs`, `postal_code_confirmation`, `full_address_confirmation`, `address_correction`)
- `metadata`: Implementation-specific configuration

Where:
- `avs` — Automatic Address Verification System (card network)
- `postal_code_confirmation` — Simple ZIP/postal code confirmation dialog
- `full_address_confirmation` — Full address confirmation dialog
- `address_correction` — Address correction/suggestion dialog (e.g., "You entered 123 Main St, we suggest 123 Main Street")

**Payment Method Update** (structured object):
- `allowed_updates`: Update types (`card_expiry`, `billing_address`, `card_replacement`, `cvv_reentry`)
- `metadata`: Implementation-specific configuration

**Agent-specific settings**:
- `max_redirects` — Maximum number of redirects
- `redirect_context` — How redirects are handled (`in_app`, `external_browser`, `none`)
- `max_interaction_depth` — Maximum depth of nested interactions
- `display_context` — How interventions are presented (`native`, `webview`, `modal`, `redirect`)

**Seller-specific settings**:
- `required` — Array of required intervention methods
- `enforcement` — When interventions are enforced (`always`, `conditional`, `optional`)

### Feature Capabilities

**Agent features**:
- `async_completion` — Can poll/receive webhooks for async completion
- `session_persistence` — Can save and resume sessions
- `multi_session` — Can manage multiple concurrent sessions

**Seller features**:
- `partial_auth` — Supports partial authorization
- `saved_payment_methods` — Can save payment methods for future use
- `network_tokenization` — Supports network tokenized cards
- `incremental_auth` — Supports incremental authorization
- `async_completion` — Supports asynchronous payment completion

---

## API Changes

### Request Changes

**`POST /checkout_sessions` — Create Session**

Added **REQUIRED** field:
```json
{
  "agent_capabilities": {
    "interventions": { ... },
    "features": { ... }
  }
}
```

### Response Changes

**All checkout session responses** (`CheckoutSessionBase`)

Added **REQUIRED** field:
```json
{
  "seller_capabilities": {
    "payment_methods": [ ... ],
    "interventions": { ... },
    "features": { ... }
  }
}
```

**Removed field**:
- `payment_provider` (top-level) — PSP information now in payment method objects via `providers` array

### Affected Endpoints

- `POST /checkout_sessions` — Create Session
- `GET /checkout_sessions/{id}` — Retrieve Session
- `POST /checkout_sessions/{id}` — Update Session
- `POST /checkout_sessions/{id}/complete` — Complete Session

---

## Error Handling

### New Error Codes

**`payment_method_unsupported`**
```json
{
  "status": "not_ready_for_payment",
  "messages": [{
    "type": "error",
    "code": "payment_method_unsupported",
    "content": "The requested payment method is not supported by this merchant."
  }]
}
```

**`intervention_required`**
```json
{
  "status": "not_ready_for_payment",
  "messages": [{
    "type": "error",
    "code": "intervention_required",
    "content": "This purchase requires 3D Secure authentication, which cannot be completed in your current environment."
  }]
}
```

### Forward Compatibility

- Implementations MUST ignore unknown capability values
- Unknown metadata keys MUST be gracefully ignored
- Enables new capabilities to be added without breaking changes

---

## Adoption Strategy

### Adoption Model

- **Extension is opt-in**: Implementations MAY choose to implement capability negotiation
- **Implementation is all-in**: When adopted, both `agent_capabilities` and `seller_capabilities` MUST be present
- **No partial implementations**: Ensures predictable behavior and eliminates ambiguity

### Incremental Adoption

Implementations MAY adopt in phases:

1. **Phase 1 - Read-only**: Exchange capabilities for logging/analytics only
2. **Phase 2 - Optimization**: Use capabilities to optimize checkout flow
3. **Phase 3 - Enforcement**: Enforce capability compatibility and return errors for mismatches

**Note**: All phases require both fields to be present. Phases differ only in how the information is used.

### Backward Compatibility

- **Breaking change**: This extension requires new required fields
- **Versioning**: Implementations can use API versioning to adopt gradually
- **Migration path**: Existing implementations continue to work on older API versions

---

## Security Considerations

### Agent Capability Privacy

Agent capabilities may reveal information about the user's device or environment. Agents SHOULD:
- Only declare capabilities necessary for checkout
- Avoid capabilities that could fingerprint users
- Use minimum specific identifiers needed

### Validation and Trust

- Sellers MUST validate all payment method and intervention capabilities
- Capability declarations are hints, not guarantees
- Sellers SHOULD verify Agent capabilities match actual behavior
- Unknown capabilities MUST NOT cause security errors

### Metadata Safety

- Metadata MUST NOT be required for core functionality
- Implementations MUST handle arbitrary metadata values safely
- No sensitive information (PII, credentials) in metadata
- Validate metadata before using for business logic

---

## Testing and Conformance

### Agent Implementation Checklist

- [ ] Sends `agent_capabilities` in all checkout session requests
- [ ] Declares accurate intervention capabilities
- [ ] Handles unknown `seller_capabilities` values gracefully
- [ ] Respects Seller's intervention requirements
- [ ] Can handle `payment_method_unsupported` errors
- [ ] Can handle `intervention_required` errors

### Seller Implementation Checklist

- [ ] Returns `seller_capabilities` in all checkout session responses
- [ ] Declares all accepted payment methods with appropriate constraints
- [ ] Declares accurate intervention requirements
- [ ] Handles unknown `agent_capabilities` values gracefully
- [ ] Returns appropriate errors for capability mismatches
- [ ] Validates card brands and funding types when specified

### Metadata Conformance

- [ ] Gracefully ignores unknown metadata keys
- [ ] Does not require metadata for basic functionality
- [ ] Validates metadata values before using for business logic
- [ ] Documents custom metadata conventions

---

## Examples

See comprehensive examples in:
- [examples/examples.capability_negotiation.json](../examples/examples.capability_negotiation.json)
- [examples/examples.agentic_checkout.json](../examples/examples.agentic_checkout.json)

### Quick Example: Basic Negotiation

**Request**:
```json
{
  "items": [{"id": "item_123", "quantity": 1}],
  "agent_capabilities": {
    "interventions": {
      "3ds": {
        "versions": ["2.1", "2.2"],
        "channels": ["browser"],
        "flows": ["challenge"]
      }
    },
    "features": {}
  }
}
```

**Response**:
```json
{
  "id": "cs_abc123",
  "status": "ready_for_payment",
  "seller_capabilities": {
    "payment_methods": ["card", "wallet.apple_pay"],
    "interventions": {
      "required": [],
      "3ds": {
        "versions": ["2.1", "2.2", "2.3"],
        "channels": ["browser", "mobile"],
        "flows": ["challenge", "frictionless"]
      },
      "enforcement": "conditional"
    },
    "features": {
      "network_tokenization": true
    }
  }
}
```

---

## Open Questions and Future Work

### Multi-PSP Negotiation

**Current state**: `providers` array added to payment method objects, but Agent cannot express PSP preferences.

**Future consideration**: Enable Agents to declare PSP preferences or capabilities for optimal routing.

### Dynamic Capability Updates

**Current state**: Capabilities are static per checkout session.

**Future consideration**: Allow capability updates during long-lived sessions (e.g., user moves from Wi-Fi to cellular).

### Regional Variations

**Current state**: No explicit support for geo-specific capabilities.

**Future consideration**: Add optional `regions` or `currencies` constraints to capabilities.

---

## References

- [RFC: Capability Negotiation](../rfcs/rfc.capability_negotiation.md) — Full specification
- [OpenAPI Spec](../spec/openapi/openapi.agentic_checkout.yaml) — Machine-readable API spec
- [JSON Schema](../spec/json-schema/schema.agentic_checkout.json) — Data models
- [Changelog](../changelog/unreleased.md) — Version history
- [SEP Guidelines](./sep-guidelines.md) — Proposal process
