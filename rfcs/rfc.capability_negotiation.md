# RFC: Agentic Checkout — Capability Negotiation

**Status:** Proposal  
**Version:** 2026-01-16  
**Scope:** Extension of Agentic Checkout to support capability negotiation between Agents and Sellers

This RFC extends the **Agentic Commerce Protocol (ACP)** to support **Capability Negotiation**. It defines a standard mechanism using a single `capabilities` object to declare supported features, with the server (Seller) returning only the intersection of mutually-supported capabilities.

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

1. **Single capability declaration**: Use the same `capabilities` object structure.
2. **Intersection-based response**: Sellers return only the intersection of supported capabilities, eliminating client-side matching logic.
3. **Compatibility detection**: Detect mismatches early and provide appropriate fallbacks.

---

## 2. Goals and Non-Goals

### 2.1 Goals

1. **Standardized capability exchange**: Define clear schemas for Agents to declare and Sellers to advertise capabilities.
2. **Early incompatibility detection**: Enable both parties to detect mismatches before payment authorization.
3. **Extensibility**: Support future payment methods, authentication schemes, and interaction patterns without protocol breaking changes.
4. **Graceful degradation**: Allow checkouts to proceed when possible, with clear error messages when capabilities are incompatible.
5. **Required but flexible**: Make capability negotiation mandatory while allowing implementations to start simple (empty arrays) and grow over time.

### 2.2 Non-Goals

- Defining new payment methods or authentication schemes (the mechanism is transport-neutral).
- Standardizing payment method onboarding or credential provisioning flows.
- Creating a capability discovery service or registry (capabilities are exchanged per-session).
- Mandating specific behavior when capabilities don't match (implementations may fail or fallback as appropriate).

---

## 3. Design Rationale

### 3.1 Why a single capability namespace?

A single capability namespace provides:
- **Simpler mental model**: One structure for capabilities regardless of context
- **Intersection semantics**: What matters is what's mutually supported

Use the same `capabilities` object. Context (request vs response) determines the party.

### 3.2 Why return intersection in responses?

Including only the intersection of capabilities in responses:
- **Reduces client-side logic**: No need for Agents to compute compatibility
- **Single source of truth**: The response contains exactly what will work
- **Efficient negotiation**: Combined discovery and negotiation in one round-trip
- **Context-aware**: Seller can vary capabilities by session (amount, location, item type)

---

## 4. Specification Changes

### 4.1 Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY** are to be interpreted as described in RFC 2119/8174.

### 4.2 New Object

#### 4.2.1 `capabilities` (Request and Response Object)

This object is used to declare capabilities. Agents include it in requests; Sellers return the intersection in responses.

**Location**: 
- Request: Top-level field in `CheckoutSessionCreateRequest` schema
- Response: Top-level field in `CheckoutSession` response schema

**Requirement**: REQUIRED

**Agent Request Schema**:

```json
{
  "capabilities": {
    "interventions": {
      "supported": ["3ds", "biometric"],
      "display_context": "webview",
      "redirect_context": "in_app",
      "max_redirects": 1,
      "max_interaction_depth": 1
    }
  }
}
```

**Seller Response Schema** (intersection of Agent + Seller capabilities):

```json
{
  "capabilities": {
    "payment_methods": [
      {
        "method": "card",
        "brands": ["visa", "mastercard"],
        "funding_types": ["credit", "debit"]
      },
      "card.network_token",
      "wallet.apple_pay"
    ],
    "interventions": {
      "supported": ["3ds", "biometric"],
      "required": [],
      "enforcement": "conditional"
    }
  }
}
```

Note: `interventions.supported` in the Seller response contains **only** the intersection of supported interventions.

---

### 4.3 Field Definitions

#### 4.3.1 `capabilities` Fields

##### `payment_methods` (array of strings or objects, REQUIRED in responses)

List of payment methods the Seller accepts for this checkout session. Values can be simple hierarchical identifiers or objects with additional constraints.

**Note**: This field will be replaced by `payment_handlers` in a future specification, which will provide a more rigorous way of expressing how payments will be handled.

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

**Extensibility**: Implementations MAY define custom payment method identifiers. Agents SHOULD ignore unknown values.

**Note**: Only present in responses (seller context).

##### `interventions` (object, OPTIONAL)

User intervention capabilities.

- **`supported`** (array of strings, REQUIRED if `interventions` is present): 
  - **In requests (agent context)**: Intervention types the agent can handle
  - **In responses (seller context)**: Intersection of supported intervention types
  - Values: `3ds`, `biometric`, `address_verification`

- **`required`** (array of strings, OPTIONAL, only in responses): Intervention methods required for this session. If empty or absent, no specific interventions are required.
  - Values: `3ds`, `biometric`

- **`enforcement`** (enum string, OPTIONAL, only in responses): When required interventions are enforced.
  - Values:
    - `always` — Required interventions enforced for all transactions
    - `conditional` — Required interventions enforced based on risk signals (default)
    - `optional` — Interventions optional, may be requested by issuer

- **`display_context`** (enum string, OPTIONAL, only in requests): How the Agent presents interventions.
  - Values:
    - `native` — Native UI components
    - `webview` — Embedded web content
    - `modal` — Modal dialogs
    - `redirect` — External page navigation

- **`redirect_context`** (enum string, OPTIONAL, only in requests): How the Agent handles redirects.
  - Values:
    - `in_app` — Can display redirect targets in embedded webview
    - `external_browser` — Opens system browser for redirects
    - `none` — Cannot handle redirects

- **`max_redirects`** (integer, OPTIONAL, only in requests): Maximum number of redirects the Agent can handle in a single flow (default: 0).

- **`max_interaction_depth`** (integer, OPTIONAL, only in requests): Maximum depth of nested interactions the Agent can handle (default: 1).

**Note on 3DS:** The `3ds` value indicates support for 3D Secure authentication. Version specifics (3DS 2.1, 2.2, 2.3) and flow preferences (frictionless, challenge) should not be enumerated here as:
- 3DS1 is deprecated and no longer in use
- All modern 3DS implementations should support both frictionless and challenge flows
- Version-specific support should be handled through PSP configuration, not capability negotiation
- Flow selection (frictionless vs challenge) is determined dynamically by the issuer based on risk assessment

---

### 4.4 Endpoint Changes

#### 4.4.1 `POST /checkout_sessions` — Create Session

**Request** (new required field):

```json
{
  "line_items": [...],
  "fulfillment_details": {...},
  "capabilities": {
    "interventions": {
      "supported": ["3ds", "address_verification"],
      "display_context": "webview",
      "redirect_context": "external_browser",
      "max_redirects": 1,
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
  "capabilities": {
    "payment_methods": ["card", "card.network_token", "wallet.apple_pay"],
    "interventions": {
      "supported": ["3ds", "address_verification"],
      "required": [],
      "enforcement": "conditional"
    }
  },
  "payment_provider": {
    "provider": "stripe"
  },
  ...
}
```

**Note**: `capabilities.interventions.supported` in the response contains **only the intersection** of supported interventions. For example, if Agent declares `["3ds", "address_verification"]` and Seller supports `["3ds", "biometric", "address_verification"]`, the response will show `["3ds", "address_verification"]`.

#### 4.4.2 Other Endpoints

The following endpoints also return `capabilities`:
- `POST /checkout_sessions/{id}` — Update Session (response includes updated capabilities)
- `GET /checkout_sessions/{id}` — Retrieve Session
- `POST /checkout_sessions/{id}/complete` — Complete Session (final response includes capabilities)

`capabilities` in requests is **write-only** and not returned in any response.

---

### 4.5 Capability Matching and Intersection

#### 4.5.1 Server-Side Intersection Computation

When an Agent sends a `capabilities` object, the Seller:

1. **Computes the intersection** of `capabilities.interventions.supported` arrays
2. **Returns only mutually-supported interventions** in the response
3. **Includes seller-specific fields** (`payment_methods`, `required`, `enforcement`)

This eliminates client-side matching logic and provides a single source of truth.

**Example**:
- Agent sends: `{"interventions": {"supported": ["3ds", "biometric", "address_verification"]}}`
- Seller supports: `["3ds", "address_verification"]` internally
- Seller returns: `{"interventions": {"supported": ["3ds", "address_verification"], "required": [], "enforcement": "conditional"}}`

#### 4.5.2 Intervention Compatibility

Interventions are compatible when:
1. The intersection of supported interventions (computed by Seller) includes all `required` interventions, OR
2. Seller's `interventions.required` is empty/absent

AND

3. Expected interaction depth ≤ Agent's `max_interaction_depth` (if declared)

**Note**: The Agent does not need to perform intersection logic—the Seller's response already contains the answer.

#### 4.5.3 Feature Compatibility

Feature compatibility is implementation-defined. Agents and Sellers MAY use feature flags (in future extensions) to:
- Optimize the checkout experience when both parties support a feature
- Provide fallback behavior when features are unsupported
- Display warnings or informational messages to users

---

### 4.6 Error Handling

#### 4.6.1 Intervention Requirement Mismatch

When the intersection of supported interventions does not include all required interventions:

```json
{
  "status": "not_ready_for_payment",
  "capabilities": {
    "payment_methods": ["card"],
    "interventions": {
      "supported": [],
      "required": ["3ds"],
      "enforcement": "always"
    }
  },
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

Note: `capabilities.interventions.supported` is empty because there is no intersection between Agent and Seller capabilities.

#### 4.6.2 Unknown Capabilities

Implementations MUST ignore unknown capability values. This enables forward compatibility as new capabilities are added to the protocol.

---

## 5. Example Interactions

### 5.1 Successful Capability Negotiation

**Request** (`POST /checkout_sessions`):

```json
{
  "line_items": [{"id": "item_123", "quantity": 1}],
  "capabilities": {
    "interventions": {
      "supported": ["3ds", "address_verification"],
      "display_context": "webview",
      "redirect_context": "in_app",
      "max_interaction_depth": 2
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
  "capabilities": {
    "payment_methods": [
      {
        "method": "card",
        "brands": ["visa", "mastercard", "amex"],
        "funding_types": ["credit", "debit"]
      },
      "card.network_token",
      "wallet.apple_pay"
    ],
    "interventions": {
      "supported": ["3ds", "address_verification"],
      "required": [],
      "enforcement": "conditional"
    }
  },
  "line_items": [...],
  ...
}
```

**Note**: Seller internally supports `["3ds", "biometric", "address_verification"]`, but returns only the intersection `["3ds", "address_verification"]` because Agent doesn't support `biometric`.

### 5.2 Intervention Requirement

**Request**:

```json
{
  "line_items": [{"id": "item_789", "quantity": 1}],
  "capabilities": {
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
  "capabilities": {
    "payment_methods": [
      {
        "method": "card",
        "brands": ["visa", "mastercard"]
      }
    ],
    "interventions": {
      "supported": [],
      "required": ["3ds"],
      "enforcement": "always"
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

The Agent can now inform the user that 3D Secure authentication will be required and the intersection is empty (Agent supports nothing that Seller requires).

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
- Compute the intersection but still enforce `required` interventions

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

Capability negotiation using a `capabilities` object is a required part of the Agentic Commerce Protocol:

**For Agents:**
- Agents MUST include `capabilities` in all checkout session creation requests
- At minimum, Agents MUST declare: `{"interventions": {"supported": []}}`

**For Sellers:**
- Sellers MUST include `capabilities` in all checkout session responses
- Sellers MUST declare at least their supported payment methods
- Sellers MUST compute and return the intersection of `interventions.supported`

This approach provides:
- ✅ **Predictable behavior**: All implementations support capability negotiation
- ✅ **Strong guarantees**: Capabilities are always present and trustworthy
- ✅ **No ambiguity**: No need to check for field presence or handle missing capabilities
- ✅ **Simpler logic**: No complex client-side intersection computation
- ✅ **Better UX**: Agents can optimize flows and detect incompatibilities early

### 7.2 Incremental Usage Strategy

While the `capabilities` field is required, implementations MAY adopt usage in phases:

1. **Phase 1 - Read-only**: Agent sends `capabilities`; Seller returns intersection but uses it only for logging/analytics
2. **Phase 2 - Optimization**: Agent sends `capabilities`; Seller uses the intersection to optimize checkout flow (e.g., pre-selecting payment methods, tailoring UI)
3. **Phase 3 - Enforcement**: Agent sends `capabilities`; Seller enforces capability compatibility and returns clear errors for mismatches

**Note**: All phases require the `capabilities` field to be present. Phases differ in how Sellers *use* the capability information, not whether it's provided.

### 7.3 Forward Compatibility

- New capability identifiers MAY be added without breaking changes
- Implementations MUST ignore unknown capability values
- Capability matching uses prefix-based hierarchies to support new subtypes
- Validators SHOULD be lenient for unknown optional fields

### 7.4 Relationship to Existing Fields

**`payment_provider` object:**
- The `payment_provider.provider` field remains and identifies the PSP integration (e.g., "stripe")
- The previous `payment_provider.supported_payment_methods` field has been removed as it was redundant with `capabilities.payment_methods`
- `capabilities.payment_methods` (in responses) is now the single source of truth for payment method support

**Future consideration - Multi-PSP routing:**
- This extension does not currently support multi-PSP capability negotiation
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

1. Extend `CheckoutSession` response schema to include **required** `capabilities` object
2. Extend `CheckoutSessionCreateRequest` schema to include **required** `capabilities` object
3. Add capability identifiers to a shared definitions section or separate capability registry document
4. Update OpenAPI schemas with the new `capabilities` object
5. Add examples demonstrating capability negotiation scenarios with intersection semantics
6. Add validation rules for capability field structures
7. Document server-side intersection computation algorithms
8. Add entry to `changelog/unreleased.md`

---

## 10. Conformance Checklist

An implementation conforming to the **Agentic Commerce Protocol with Capability Negotiation**:

**MUST requirements:**

- [ ] MUST include `capabilities` in all checkout session creation requests
- [ ] MUST include `capabilities` in all checkout session responses
- [ ] MUST include at minimum `capabilities.payment_methods` in responses
- [ ] MUST compute and return the intersection of `interventions.supported` in responses
- [ ] MUST gracefully ignore unknown capability values in agent requests
- [ ] MUST NOT use agent-declared capabilities as the sole source of truth for security decisions
- [ ] MUST validate payment method compatibility server-side regardless of declared capabilities

**SHOULD requirements:**

- [ ] SHOULD return appropriate error messages when capabilities are incompatible
- [ ] SHOULD use capability information to optimize the checkout flow when possible
- [ ] SHOULD only advertise session-relevant capabilities
- [ ] SHOULD use hierarchical capability matching for payment methods
- [ ] SHOULD detect intervention incompatibility early and inform the user
- [ ] SHOULD provide clear indication when intersection is empty

**MAY requirements:**

- [ ] MAY enforce capability compatibility and reject incompatible sessions
- [ ] MAY define custom capability identifiers for domain-specific features
- [ ] MAY vary seller capabilities based on session context (amount, items, location)

---

## 11. Future Extensions

This RFC provides a foundation for future capability-based features:

- **Feature flags**: Optional additional fields within `capabilities` for signaling support for features like `network_tokenization`, `saved_payment_methods`, `async_completion`, etc.
- **Dynamic capability discovery**: Separate endpoints for capability queries before session creation
- **Capability constraints**: Allowing Agents to specify required capabilities and receive compatible Sellers
- **Capability-based routing**: Agent platforms routing checkouts to Sellers based on capability match
- **Progressive capability enhancement**: Upgrading session capabilities mid-flow based on context changes
- **Capability versioning**: Explicit versioning of capability schemas for stricter validation

---

## 12. Change Log

- **2026-01-28**: Updated to use single `capabilities` object without role field. Context (request vs response) determines the party. Server computes and returns intersection of supported interventions.
- **2026-01-16**: Initial proposal for bidirectional capability negotiation via `agent_capabilities` and `seller_capabilities` objects.

