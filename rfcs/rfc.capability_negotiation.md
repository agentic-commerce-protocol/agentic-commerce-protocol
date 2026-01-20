# RFC: Agentic Checkout — Capability Negotiation

**Status:** Proposal  
**Version:** 2026-01-16  
**Scope:** Extension of Agentic Checkout to support bidirectional capability negotiation between Agents and Sellers

This RFC extends the **Agentic Commerce Protocol (ACP)** to support **Capability Negotiation**. It defines standard mechanisms for Agents to declare their interaction capabilities (authentication support, intervention handling) and for Sellers to advertise their capabilities (supported payment methods, authentication requirements, intervention types, features) during checkout session creation.

---

## 1. Motivation

In agentic commerce, Agents and Sellers have varying capabilities that affect the checkout experience. Currently, the protocol lacks a standardized way for participants to discover and negotiate these capabilities, leading to:

- **Implementation complexity**: Agents and Sellers must rely on out-of-band configuration or trial-and-error to determine compatibility.
- **Limited extensibility**: New features (e.g., biometric authentication, buy-now-pay-later) require custom integration work.
- **Suboptimal user experiences**: Without knowing each party's capabilities upfront, both Agents and Sellers cannot optimize the checkout flow.

Without capability negotiation:

- Agents cannot preemptively determine if they can complete a checkout.
- Sellers cannot communicate requirements (e.g., "3DS required for this transaction").
- The ecosystem cannot evolve to support new payment methods or authentication schemes without breaking existing integrations.

This RFC proposes a **capability negotiation** mechanism that enables:

1. **Agent capability declaration**: Agents declare their interaction capabilities (authentication, interventions) in checkout session requests.
2. **Seller capability advertisement**: Sellers declare what they support (payment methods, authentication, interventions, features) in checkout session responses.
3. **Compatibility detection**: Both parties can detect mismatches early and provide appropriate fallbacks.

---

## 2. Goals and Non-Goals

### 2.1 Goals

1. **Standardized capability exchange**: Define clear schemas for Agents to declare and Sellers to advertise capabilities.
2. **Early incompatibility detection**: Enable both parties to detect mismatches before payment authorization.
3. **Extensibility**: Support future payment methods, authentication schemes, and interaction patterns without protocol breaking changes.
4. **Graceful degradation**: Allow checkouts to proceed when possible, with clear error messages when capabilities are incompatible.
5. **Backwards compatibility**: Ensure existing implementations continue to work without modification.

### 2.2 Non-Goals

- Defining new payment methods or authentication schemes (the mechanism is transport-neutral).
- Standardizing payment method onboarding or credential provisioning flows.
- Creating a capability discovery service or registry (capabilities are exchanged per-session).
- Mandating specific behavior when capabilities don't match (implementations may fail or fallback as appropriate).

---

## 3. Design Rationale

### 3.1 Why bidirectional negotiation?

Capabilities are inherently bidirectional:
- Agents may be able to handle features that Sellers require (e.g., displaying 3DS authentication frames when Seller requires 3DS).
- Agents may prefer features that Sellers support (e.g., biometric authentication when Seller supports it).

Bidirectional negotiation allows both parties to make informed decisions.

### 3.2 Why advertise in responses rather than a separate discovery endpoint?

Including capabilities in checkout session responses:
- Reduces round trips (no separate discovery call needed).
- Ensures capability data is always fresh and session-specific.
- Allows capabilities to vary by session context (e.g., transaction amount, user location, item type).

### 3.3 Why structured enums over free-form strings?

Structured capability identifiers enable:
- Client-side validation and UI adaptation.
- Standardized capability matching logic.
- Future extension through versioned enum additions.

### 3.4 Why separate from `payment_provider`?

The `payment_provider` object identifies the PSP integration layer (e.g., Stripe, Adyen). Capabilities span broader concerns:
- Payment method support with detailed constraints (card brands, funding types)
- Authentication and security (3DS, biometrics, device binding)
- Interaction patterns (redirects, in-app prompts, async flows)
- Agent-specific features (delegation, cart persistence, multi-party checkout)

Separating capabilities provides a cleaner, more extensible design. With this extension, `seller_capabilities.payment_methods` becomes the single source of truth for payment method support.

---

## 4. Specification Changes

### 4.1 Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY** are to be interpreted as described in RFC 2119/8174.

### 4.2 New Objects

#### 4.2.1 `agent_capabilities` (Request Object)

Agents include this object in checkout session creation requests to declare their capabilities.

**Location**: Top-level field in `CheckoutSessionCreateRequest` schema.
**Requirement**: REQUIRED

**Schema**:

```json
{
  "agent_capabilities": {
    "interventions": {
      "3ds": {
        "versions": ["2.1", "2.2"],
        "channels": ["browser", "mobile"],
        "flows": ["challenge"]
      },
      "otp": {},
      "email_verification": {},
      "max_redirects": 1,
      "redirect_context": "in_app",
      "max_interaction_depth": 1,
      "display_context": "webview"
    },
    "features": {
      "async_completion": true,
      "session_persistence": true
    }
  }
}
```

#### 4.2.2 `seller_capabilities` (Response Object)

Sellers include this object in checkout session responses to advertise their capabilities.

**Location**: Top-level field in `CheckoutSession` response schema.
**Requirement**: REQUIRED

**Schema**:

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
      "card.network_token",
      "bnpl.klarna",
      "wallet.apple_pay"
    ],
    "interventions": {
      "required": ["3ds"],
      "3ds": {
        "versions": ["2.1", "2.2", "2.3"],
        "channels": ["browser", "mobile", "3ri"],
        "flows": ["challenge", "frictionless"]
      },
      "biometric": {},
      "otp": {},
      "email_verification": {},
      "address_verification": {},
      "enforcement": "conditional"
    },
    "features": {
      "partial_auth": true,
      "saved_payment_methods": true,
      "network_tokenization": true
    }
  }
}
```

---

### 4.3 Field Definitions

#### 4.3.1 `agent_capabilities` Fields

##### `interventions` (object, OPTIONAL)

Intervention and authentication methods the Agent can handle when raised by Seller.

**Intervention-specific capabilities:**

**Intervention-specific capabilities:**

- **`3ds`** (object, OPTIONAL): 3D Secure capabilities
  - **`versions`** (array of strings): Supported 3DS versions
    - Values: `2.1`, `2.2`, `2.3`
  - **`channels`** (array of strings): Supported 3DS channels
    - Values: `browser` — Browser-based flows, `mobile` — Mobile SDK flows, `3ri` — 3DS Requestor Initiated
  - **`flows`** (array of strings): Supported 3DS flow types
    - Values: `challenge` — In-context challenge frame, `frictionless` — No user interaction
  - **`metadata`** (object, OPTIONAL): Additional implementation-specific configuration (key-value pairs)

- **`biometric`** (object, OPTIONAL): Biometric authentication (fingerprint, Face ID, etc.)
  - **`types`** (array of strings, OPTIONAL): Types of biometric authentication supported
    - Values: `fingerprint`, `face_id`, `face_recognition`, `iris`, `voice`
  - **`fallback_available`** (boolean, OPTIONAL): Whether fallback to non-biometric auth is available
  - **`metadata`** (object, OPTIONAL): Additional implementation-specific configuration (key-value pairs)

- **`otp`** (object, OPTIONAL): One-time password capability
  - **`delivery_methods`** (array of strings, OPTIONAL): OTP delivery methods supported
    - Values: `sms`, `voice`, `authenticator_app`
  - **`length`** (integer, OPTIONAL): OTP code length (4-10 digits)
  - **`ttl_seconds`** (integer, OPTIONAL): Time-to-live for OTP in seconds (minimum 30)
  - **`max_attempts`** (integer, OPTIONAL): Maximum number of verification attempts (minimum 1)
  - **`metadata`** (object, OPTIONAL): Additional implementation-specific configuration (key-value pairs)

- **`email_verification`** (object, OPTIONAL): Email verification capability
  - **`methods`** (array of strings, OPTIONAL): Email verification methods supported
    - Values: `code`, `magic_link`, `both`
  - **`code_length`** (integer, OPTIONAL): Verification code length (4-10 digits, if code method supported)
  - **`link_ttl_seconds`** (integer, OPTIONAL): Magic link time-to-live in seconds (minimum 60, if link method supported)
  - **`metadata`** (object, OPTIONAL): Additional implementation-specific configuration (key-value pairs)

- **`sms_verification`** (object, OPTIONAL): SMS verification capability
  - **`code_length`** (integer, OPTIONAL): Verification code length (4-10 digits)
  - **`ttl_seconds`** (integer, OPTIONAL): Code time-to-live in seconds (minimum 30)
  - **`max_attempts`** (integer, OPTIONAL): Maximum number of verification attempts (minimum 1)
  - **`metadata`** (object, OPTIONAL): Additional implementation-specific configuration (key-value pairs)

- **`address_verification`** (object, OPTIONAL): Address confirmation capability
  - **`methods`** (array of strings, OPTIONAL): Address verification methods supported
    - Values: `avs` — Automatic address verification system, `postal_code_confirmation` — Simple ZIP/postal code confirmation dialog, `full_address_confirmation` — Full address confirmation dialog, `address_correction` — Address correction/suggestion dialog (e.g., "You entered X, we suggest Y")
  - **`metadata`** (object, OPTIONAL): Additional implementation-specific configuration (key-value pairs)

- **`payment_method_update`** (object, OPTIONAL): Payment method update capability
  - **`allowed_updates`** (array of strings, OPTIONAL): Types of payment method updates allowed
    - Values: `card_expiry`, `billing_address`, `card_replacement`, `cvv_reentry`
  - **`metadata`** (object, OPTIONAL): Additional implementation-specific configuration (key-value pairs)

**Note on structured fields:** All intervention types now have prescriptive structured fields for common configuration options, while maintaining a `metadata` field for implementation-specific extensions. This balances standardization with flexibility.

**General capabilities:**

- **`max_redirects`** (integer, OPTIONAL): Maximum number of redirects the Agent can handle in a single flow (default: 0).

- **`redirect_context`** (enum string, OPTIONAL): How the Agent handles redirects.
  - Values: `in_app`, `external_browser`, `none`

- **`max_interaction_depth`** (integer, OPTIONAL): Maximum depth of nested interactions the Agent can handle (default: 1).

- **`display_context`** (enum string, OPTIONAL): How the Agent presents interventions.
  - Values: `native`, `webview`, `modal`, `redirect`

##### `features` (object, OPTIONAL)

Agent-specific feature support.

- **`async_completion`** (boolean, default: `false`): Agent can poll or receive webhooks for async payment completion.
- **`session_persistence`** (boolean, default: `false`): Agent can save and resume checkout sessions across interactions.
- **`multi_session`** (boolean, default: `false`): Agent can manage multiple concurrent checkout sessions.

---

#### 4.3.2 `seller_capabilities` Fields

##### `payment_methods` (array of strings or objects, REQUIRED)

List of payment methods the Seller accepts for this checkout session. Values can be simple hierarchical identifiers or objects with additional constraints.

**Simple string format** - hierarchical identifiers following the pattern `{method}[.{subtype}]`:
- `card` — Generic credit/debit card
- `card.network_token` — Card via network tokenization (Visa Token Service, Mastercard MDES)
- `card.digital_wallet` — Card presented via digital wallet (Apple Pay, Google Pay)
- `bnpl.{provider}` — Buy Now Pay Later (e.g., `bnpl.klarna`, `bnpl.affirm`, `bnpl.afterpay`)
- `wallet.{provider}` — Digital wallets (e.g., `wallet.apple_pay`, `wallet.google_pay`, `wallet.paypal`)
- `bank_transfer.{type}` — Bank transfers (e.g., `bank_transfer.ach`, `bank_transfer.sepa`)

**Object format** - for methods requiring additional constraints:

```json
{
  "method": "card",
  "brands": ["visa", "mastercard", "amex"],
  "funding_types": ["credit", "debit"]
}
```

**Object fields:**
- **`method`** (string, REQUIRED): The payment method identifier
- **`brands`** (array of strings, OPTIONAL): For card methods, specific card brands/networks accepted
  - Values: `visa`, `mastercard`, `amex`, `discover`, `diners`, `jcb`, `unionpay`, `eftpos`, `interac`
- **`funding_types`** (array of strings, OPTIONAL): For card methods, funding types accepted
  - Values: `credit`, `debit`, `prepaid`
- **`providers`** (array of strings, OPTIONAL): Payment service provider(s) that can process this payment method
  - Values: `stripe` (extensible)

**Extensibility**: Implementations MAY define custom payment method identifiers. Agents SHOULD ignore unknown values.

##### `interventions` (object, OPTIONAL)

Intervention and authentication methods the Seller can handle and may raise to Agent to complete.

- **`required`** (array of strings, OPTIONAL): Intervention methods required for this session. If empty or absent, no specific interventions are required.
  - Values: `3ds`, `biometric`, `otp`, `email_verification`, `sms_verification`

**Intervention-specific capabilities:**

- **`3ds`** (object, OPTIONAL): 3D Secure capabilities
  - **`versions`** (array of strings): Supported 3DS versions
    - Values: `2.1`, `2.2`, `2.3`
  - **`channels`** (array of strings): Supported 3DS channels
    - Values: `browser` — Browser-based flows, `mobile` — Mobile SDK flows, `3ri` — 3DS Requestor Initiated (MIT/CIT)
  - **`flows`** (array of strings): Supported 3DS flow types
    - Values: `challenge` — In-context challenge frame, `frictionless` — No user interaction

- **`biometric`** (object, OPTIONAL): Biometric authentication (fingerprint, Face ID, etc.)

- **`otp`** (object, OPTIONAL): One-time password capability

- **`email_verification`** (object, OPTIONAL): Email verification capability

- **`sms_verification`** (object, OPTIONAL): SMS verification capability

- **`address_verification`** (object, OPTIONAL): Address confirmation capability

- **`payment_method_update`** (object, OPTIONAL): Payment method update capability

**General settings:**

- **`enforcement`** (enum string, OPTIONAL): When required interventions are enforced.
  - Values: `always`, `conditional` (default), `optional`

##### `features` (object, OPTIONAL)

Additional checkout features supported by the Seller.

- **`partial_auth`** (boolean, default: `false`): Supports partial authorization (charging less than requested amount)
- **`saved_payment_methods`** (boolean, default: `false`): Can save payment methods for future use
- **`network_tokenization`** (boolean, default: `false`): Supports network tokenized cards
- **`incremental_auth`** (boolean, default: `false`): Supports incremental authorization (hotels, car rentals)
- **`async_completion`** (boolean, default: `false`): Supports asynchronous payment completion (bank transfers, delayed authorization)

---

### 4.4 Endpoint Changes

#### 4.4.1 `POST /checkout_sessions` — Create Session

**Request** (new optional field):

```json
{
  "items": [...],
  "fulfillment_details": {...},
  "agent_capabilities": {
    "interventions": {
      "supported": ["3ds_redirect", "address_verification"],
      "max_redirects": 1,
      "redirect_context": "external_browser",
      "max_interaction_depth": 1
    }
  }
}
```

**Response** (new field in `CheckoutSession`):

```json
{
  "id": "checkout_session_123",
  "status": "ready_for_payment",
  "seller_capabilities": {
    "payment_methods": ["card", "card.network_token", "wallet.apple_pay"],
    "authentication": {
      "required": [],
      "supported": ["3ds", "3ds2"],
      "enforcement": "conditional"
    },
    "interventions": {
      "supported": ["3ds_redirect", "3ds_challenge"]
    },
    "features": {
      "network_tokenization": true,
      "saved_payment_methods": true
    }
  },
  ...
}
```

#### 4.4.2 Other Endpoints

The following endpoints also return `seller_capabilities`:
- `POST /checkout_sessions/{id}` — Update Session (response includes updated capabilities)
- `GET /checkout_sessions/{id}` — Retrieve Session
- `POST /checkout_sessions/{id}/complete` — Complete Session (final response includes capabilities)

`agent_capabilities` is **write-only** and not returned in any response.

---

### 4.5 Capability Matching

#### 4.5.1 Intervention Compatibility

Interventions are compatible when:
1. Agent's `interventions.supported` includes all of Seller's `required` intervention methods (if any), OR
2. Seller's `interventions.required` is empty/absent

AND

3. Agent's `interventions.supported` is a superset of Seller's `interventions.supported`, OR
4. Agent can handle the essential intervention types needed for required methods

Expected interaction depth SHOULD be ≤ Agent's `max_interaction_depth` (if declared).

#### 4.5.2 Feature Compatibility

Feature compatibility is implementation-defined. Agents and Sellers MAY use feature flags to:
- Optimize the checkout experience when both parties support a feature
- Provide fallback behavior when features are unsupported
- Display warnings or informational messages to users

---

### 4.6 Error Handling

#### 4.6.1 Intervention Requirement Mismatch

When Agent cannot support interventions that Seller requires:

```json
{
  "status": "not_ready_for_payment",
  "messages": [
    {
      "type": "error",
      "code": "intervention_required",
      "content_type": "plain",
      "content": "This purchase requires 3D Secure authentication, which cannot be completed in your current environment."
    }
  ]
}
```

#### 4.6.2 Unknown Capabilities

Implementations MUST ignore unknown capability values. This enables forward compatibility as new capabilities are added to the protocol.

---

## 5. Example Interactions

### 5.1 Successful Capability Negotiation

**Request** (`POST /checkout_sessions`):

```json
{
  "items": [{ "id": "item_123", "quantity": 1 }],
  "agent_capabilities": {
    "interventions": {
      "supported": ["3ds_redirect", "3ds_challenge", "otp", "email_verification", "otp_verification", "email_verification"],
      "redirect_context": "in_app",
      "max_interaction_depth": 2,
      "display_context": "webview"
    }
  }
}
```

**Response** (`201 Created`):

```json
{
  "id": "cs_abc123",
  "status": "ready_for_payment",
  "currency": "usd",
  "seller_capabilities": {
    "payment_methods": [
      {
        "method": "card",
        "brands": ["visa", "mastercard", "amex"],
        "funding_types": ["credit", "debit"]
      },
      "card.network_token",
      "wallet.apple_pay"
    ],
    "authentication": {
      "required": [],
      "supported": ["3ds", "3ds2"],
      "enforcement": "conditional"
    },
    "interventions": {
      "supported": ["3ds_redirect", "3ds_challenge"]
    },
    "features": {
      "network_tokenization": true,
      "partial_auth": false
    }
  },
  "line_items": [...],
  ...
}
```

### 5.2 Authentication Requirement

**Request**:

```json
{
  "items": [{ "id": "item_789", "quantity": 1 }],
  "agent_capabilities": {
    "interventions": {
      "supported": []
    }
  }
}
```

**Response** (`201 Created`):

```json
{
  "id": "cs_ghi789",
  "status": "ready_for_payment",
  "currency": "usd",
  "seller_capabilities": {
    "payment_methods": [
      {
        "method": "card",
        "brands": ["visa", "mastercard"]
      }
    ],
    "authentication": {
      "required": ["3ds"],
      "supported": ["3ds", "3ds2"],
      "enforcement": "always"
    },
    "interventions": {
      "supported": ["3ds_redirect"]
    }
  },
  "messages": [
    {
      "type": "info",
      "content_type": "plain",
      "content": "This purchase will require 3D Secure authentication at checkout."
    }
  ],
  ...
}
```

The Agent can now inform the user that authentication will be required and decide whether to proceed.

---

## 6. Security & Privacy Considerations

### 6.1 Capability Disclosure

Advertised capabilities reveal information about the Seller's payment stack and security posture. Sellers SHOULD:

- Only advertise capabilities that are relevant to the current session
- Avoid exposing internal system details through custom capability identifiers
- Consider rate-limiting capability queries to prevent reconnaissance

### 6.2 Capability-Based Downgrade Attacks

Attackers may attempt to manipulate Agent capabilities to bypass security controls. Sellers MUST:

- Enforce authentication requirements regardless of Agent-declared capabilities
- Validate payment method compatibility server-side before authorization
- Never rely solely on Agent-declared capabilities for security decisions

### 6.3 Privacy of Agent Capabilities

Agent capabilities may reveal information about the user's device, environment, or identity. Agents SHOULD:

- Only declare capabilities that are necessary for the checkout
- Avoid including capabilities that could fingerprint users
- Use the minimum specific capability identifier needed (e.g., `card` instead of exact wallet type when not necessary)

### 6.4 Forward Compatibility and Unknown Values

Both parties MUST gracefully handle unknown capability values to prevent:

- Denial of service when new capabilities are introduced
- Information leakage through error messages about unsupported capabilities
- Breaking changes when the specification evolves

---

## 7. Adoption and Compatibility

### 7.1 Adoption Model

This extension uses a clean adoption model:

- **Extension is opt-in**: Implementations MAY choose to implement capability negotiation
- **Implementation is all-in**: If an implementation supports this extension, both `agent_capabilities` and `seller_capabilities` MUST be present and valid
- **No partial implementations**: This ensures predictable behavior and eliminates ambiguity

**For Agents:**
- Implementations that support this extension MUST include `agent_capabilities` in all checkout session creation requests
- At minimum, Agents MUST declare an empty capabilities object: `{ "interventions": { "supported": [] }, "features": {} }`

**For Sellers:**
- Implementations that support this extension MUST include `seller_capabilities` in all checkout session responses
- Sellers MUST declare at least their supported payment methods

This approach provides:
- ✅ **Gradual adoption**: Extensions are opt-in; existing implementations are unaffected
- ✅ **Strong guarantees**: When present, capabilities are always complete and trustworthy
- ✅ **No ambiguity**: Missing fields mean "extension not implemented," not "capabilities unknown"
- ✅ **Simpler logic**: No need for complex "if present, then..." conditionals throughout implementations

### 7.2 Incremental Adoption Strategy

Implementations MAY adopt this extension in phases:

1. **Phase 1 - Read-only**: Agent sends `agent_capabilities`; Seller returns `seller_capabilities` but uses them only for logging/analytics
2. **Phase 2 - Optimization**: Agent sends `agent_capabilities`; Seller uses them to optimize checkout flow (e.g., pre-selecting payment methods)
3. **Phase 3 - Enforcement**: Agent sends `agent_capabilities`; Seller enforces capability compatibility and returns clear errors for mismatches

**Note**: All phases require both fields to be present when the extension is implemented. Phases differ only in how Sellers use the information, not whether it's provided.

### 7.3 Forward Compatibility

- New capability identifiers MAY be added without breaking changes
- Implementations MUST ignore unknown capability values
- Capability matching uses prefix-based hierarchies to support new subtypes
- Validators SHOULD be lenient for unknown optional fields

#### 7.3.1 Metadata Extensibility

All intervention types support an optional `metadata` field alongside their prescriptive structured fields. This enables implementation-specific configuration while maintaining a standardized core.

**Key Characteristics:**
- **Prescriptive core fields**: Each intervention type defines standard fields for common configuration
- **Extensible via metadata**: Implementations can add custom configuration without protocol changes
- **Implementation-specific**: Each Agent or Seller can share additional context beyond standard fields
- **Forward compatible**: Unknown metadata keys MUST be ignored
- **Consistent pattern**: All intervention types follow the same structure (standard fields + metadata)

**Example use cases:**
```json
{
  "otp": {
    "delivery_methods": ["sms", "voice"],
    "length": 6,
    "ttl_seconds": 300,
    "max_attempts": 3,
    "metadata": {
      "regional_restrictions": ["US", "CA", "MX"],
      "carrier_support": "all_major",
      "fallback_delivery_delay": 60
    }
  },
  "biometric": {
    "types": ["fingerprint", "face_id"],
    "fallback_available": true,
    "metadata": {
      "timeout_seconds": 30,
      "retry_delay_seconds": 5,
      "device_security_level": "strong"
    }
  },
  "email_verification": {
    "methods": ["code", "magic_link"],
    "code_length": 6,
    "link_ttl_seconds": 600,
    "metadata": {
      "supports_magic_link": true,
      "custom_domain_support": true,
      "rate_limit_per_hour": 5
    }
  },
  "3ds": {
    "versions": ["2.1", "2.2"],
    "channels": ["browser", "mobile"],
    "flows": ["challenge"],
    "metadata": {
      "preferred_challenge_window": "500x600",
      "acquirer_bin": "123456"
    }
  }
}
```

**Implementation Requirements:**
- Both Agents and Sellers MUST gracefully ignore unknown metadata keys
- Metadata MUST NOT be required for basic functionality
- Implementations SHOULD document their metadata conventions
- Metadata values SHOULD use simple JSON types (string, number, boolean, array)
- Standard fields take precedence over conflicting metadata

### 7.4 Payment Service Provider Routing

Payment service provider information is now specified at the payment method level via the optional `providers` array field in `PaymentMethodObject`:

```json
{
  "method": "card",
  "brands": ["visa", "mastercard"],
  "providers": ["stripe"]
}
```

This enables:
- **Multi-PSP routing**: Sellers can indicate multiple PSPs can process a given payment method
- **Method-specific routing**: Different payment methods can use different PSPs
- **Future flexibility**: Reserved for future multi-PSP negotiation without breaking changes

**Current implementation**: The `providers` field is optional. Most implementations will specify a single provider per payment method. Multi-PSP capability negotiation may be addressed in a future extension.

**Future consideration - Multi-PSP routing:**
- This extension does not currently support Agent preferences for specific PSPs
- Sellers with multiple PSP integrations should select one provider per session based on their internal routing logic  
- Agent preferences for specific PSPs and dynamic provider selection may be addressed in a future extension if the use case becomes common

---

## 8. Relation to Existing Fields

### 8.1 `messages[]` with error codes

Existing error codes in the `messages` array remain valid for runtime errors. Capability negotiation provides proactive detection:

- **Capability negotiation**: Declares support and requirements upfront before payment attempt
- **Runtime error messages**: Indicate issues that occur during payment processing

Both mechanisms work together for a robust checkout experience.

---

## 9. Required Spec Updates (for implementers)

To implement this RFC, maintainers SHOULD:

1. Extend `CheckoutSession` response schema to include optional `seller_capabilities` object
2. Extend `CheckoutSessionCreateRequest` schema to include optional `agent_capabilities` object
3. Add capability identifiers to a shared definitions section or separate capability registry document
4. Update OpenAPI schemas with the new objects and field definitions
5. Add examples demonstrating capability negotiation scenarios
6. Add validation rules for capability field structures
7. Document capability matching algorithms
8. Add entry to `changelog/unreleased.md`

---

## 10. Conformance Checklist

An implementation claiming support for **Capability Negotiation**:

**MUST requirements:**

- [ ] MUST include `seller_capabilities` in all checkout session responses when supported
- [ ] MUST accept `agent_capabilities` in create session requests without error
- [ ] MUST include at minimum `seller_capabilities.payment_methods` when advertising capabilities
- [ ] MUST gracefully ignore unknown capability values in `agent_capabilities`
- [ ] MUST NOT use `agent_capabilities` as the sole source of truth for security decisions
- [ ] MUST validate payment method compatibility server-side regardless of declared capabilities

**SHOULD requirements:**

- [ ] SHOULD return appropriate error messages when capabilities are incompatible
- [ ] SHOULD use capability information to optimize the checkout flow when possible
- [ ] SHOULD only advertise session-relevant capabilities
- [ ] SHOULD use hierarchical capability matching for payment methods
- [ ] SHOULD detect intervention incompatibility early and inform the user

**MAY requirements:**

- [ ] MAY enforce capability compatibility and reject incompatible sessions
- [ ] MAY use `agent_capabilities.features` for checkout optimizations
- [ ] MAY define custom capability identifiers for domain-specific features
- [ ] MAY vary `seller_capabilities` based on session context (amount, items, location)

---

## 11. Future Extensions

This RFC provides a foundation for future capability-based features:

- **Dynamic capability discovery**: Separate endpoints for capability queries before session creation
- **Capability constraints**: Allowing Agents to specify required capabilities and receive compatible Sellers
- **Capability-based routing**: Agent platforms routing checkouts to Sellers based on capability match
- **Progressive capability enhancement**: Upgrading session capabilities mid-flow based on context changes
- **Capability versioning**: Explicit versioning of capability schemas for stricter validation

---

## 12. Change Log

- **2026-01-16**: Initial proposal for bidirectional capability negotiation via `agent_capabilities` and `seller_capabilities` objects.

