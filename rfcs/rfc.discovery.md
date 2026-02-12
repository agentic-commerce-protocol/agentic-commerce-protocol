# RFC: Agentic Checkout — Discovery

**Status:** Proposal  
**Version:** unreleased  
**Scope:** Platform-level capability discovery endpoint for the Agentic Commerce Protocol

This RFC introduces a lightweight `GET /capabilities` endpoint to the **Agentic Commerce Protocol (ACP)**. The endpoint allows agents to determine whether a merchant supports ACP, which protocol version is available, and what high-level features the platform offers — all before creating a checkout session and without requiring authentication.

---

## 1. Motivation

The Agentic Commerce Protocol's capability negotiation (see `rfc.capability_negotiation.md`) enables rich, session-level negotiation between agents and sellers during checkout session creation. However, agents currently have no way to answer a more fundamental question: **"Does this merchant support ACP at all?"**

Without a discovery mechanism:

- **Blind first requests**: Agents must attempt `POST /checkout_sessions` and interpret failure responses to determine if a merchant even supports ACP. This creates unnecessary sessions and wastes API calls.
- **Version ambiguity**: Agents have no way to determine the supported API version before making a request, potentially leading to version mismatch errors on the first call.
- **No feature overview**: Agents cannot know which high-level extensions or services a platform supports (e.g., orders, discounts, delegate payment) without starting a transaction.
- **No caching opportunity**: Every new checkout session re-discovers the same platform-level information that rarely changes.

### Why not use inline capabilities alone?

Inline capabilities (the `capabilities` object on `POST /checkout_sessions`) are the authoritative mechanism for **session-level** negotiation. They correctly handle:

- **Merchant-specific capabilities**: Payment methods, payment handlers, and PSP configurations that vary per merchant.
- **Feature-flagged rollouts**: Capabilities that are under gradual rollout and may vary between transactions.
- **Context-dependent capabilities**: Features that depend on order amount, buyer location, item type, or other session-specific context.

Discovery addresses a different concern: **platform-level** information that is stable, deterministic, and shared across all merchants on the platform. The two mechanisms are complementary.

---

## 2. Goals and Non-Goals

### 2.1 Goals

1. **Pre-flight compatibility check**: Enable agents to determine ACP support and version compatibility before creating sessions.
2. **No authentication required**: The endpoint MUST be publicly accessible without a Bearer token.
3. **Cacheability**: Responses SHOULD be cacheable to avoid redundant requests for stable information.
4. **Platform-scoped**: Return information that is consistent across all merchants on the platform.
5. **Simplicity**: Keep the response schema minimal and focused on information that helps agents decide whether and how to interact with the platform.

### 2.2 Non-Goals

- **Merchant-specific discovery**: Capabilities that vary per merchant (payment methods, payment handlers, PSP configurations) are out of scope. These are negotiated via the `capabilities` object on `POST /checkout_sessions`.
- **Session-level negotiation**: This endpoint does not replace or duplicate the inline capability exchange. It provides a higher-level overview.
- **Transport negotiation**: ACP currently supports REST only. Transport selection is not a concern for this endpoint.
- **Product or catalog discovery**: Discovering what a merchant sells (products, inventory, pricing) is out of scope.
- **Agent registration or whitelisting**: Agent identity and authorization are separate concerns (see GitHub Issue #15).

---

## 3. Design Rationale

### 3.1 Why platform-level, not merchant-level?

ACP is typically deployed through a platform intermediary (e.g., Stripe) that hosts the ACP server on behalf of many merchants. In this model:

- **One base URL serves many merchants** with heterogeneous capabilities.
- **Merchant identity is established through authentication** (Bearer token), which is unavailable at discovery time.
- **Merchant-specific capabilities are not deterministic** — they may be subject to feature flags, gradual rollouts, A/B testing, or session-context rules.

Platform-level information (protocol version, supported extensions, available services) is stable and shared across all merchants. This is the appropriate scope for an unauthenticated discovery endpoint.

### 3.2 Why a dedicated endpoint instead of .well-known?

ACP's existing API surface uses flat paths on the merchant's base URL (`/checkout_sessions`, `/delegate_payment`). Adding `/capabilities` follows this convention. A `/.well-known` path would introduce a new convention with no practical benefit for ACP's deployment model.

### 3.3 Why not include payment methods?

Payment method availability is:

1. **Merchant-specific**: Merchant A may accept Visa and Mastercard; Merchant B may accept only Apple Pay.
2. **Feature-flagged**: A merchant may be rolling out a new payment method at 10% of transactions.
3. **Context-dependent**: Available payment methods may vary based on order amount, buyer location, or item type.

Including payment methods in a platform-level, unauthenticated response would be either inaccurate (showing the union) or misleading (showing a subset). Session-level negotiation is the correct mechanism.

---

## 4. Specification

### 4.1 Endpoint

```
GET /capabilities
```

**Authentication**: None required. Implementations MUST NOT require a Bearer token. Implementations MAY accept an optional `API-Version` header.

**Caching**: Implementations SHOULD include a `Cache-Control` response header (e.g., `public, max-age=3600`). Agents SHOULD respect cache directives.

### 4.2 Response Schema

The response is a `DiscoveryResponse` object containing the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `protocol` | `DiscoveryProtocol` | Yes | Protocol identification and version information. |
| `extensions` | `DiscoveryExtension[]` | No | Extensions the platform supports at a high level. |
| `intervention_types` | `string[]` | No | Intervention types available on the platform. |
| `services` | `string[]` | Yes | High-level ACP services implemented by the platform. |
| `supported_currencies` | `string[]` | No | ISO 4217 currency codes supported by the platform. |
| `supported_locales` | `string[]` | No | BCP 47 locale tags supported for localized responses. |

#### DiscoveryProtocol

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Protocol identifier. Always `"acp"`. |
| `version` | `string` | Yes | Current (latest) API version, in `YYYY-MM-DD` format. |
| `supported_versions` | `string[]` | Yes | All API versions the platform supports. |
| `documentation_url` | `string` (URI) | No | URL to the platform's ACP documentation. |

#### DiscoveryExtension

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Extension identifier (e.g., `"discount"`, `"fulfillment"`). |
| `spec` | `string` (URI) | No | URL to the extension's specification document. |

#### Services Enum Values

| Value | Description |
|---|---|
| `checkout` | Checkout session management (`POST /checkout_sessions` and related endpoints). |
| `orders` | Post-purchase order lifecycle management. |
| `delegate_payment` | Payment credential delegation (`POST /delegate_payment`). |

#### Intervention Types Enum Values

| Value | Description |
|---|---|
| `3ds` | 3D Secure authentication. |
| `biometric` | Biometric verification (fingerprint, Face ID, etc.). |
| `address_verification` | Address verification service. |

### 4.3 HTTP Status Codes

| Code | Description |
|---|---|
| `200 OK` | Success. Returns `DiscoveryResponse`. |
| `429 Too Many Requests` | Rate limit exceeded. |
| `503 Service Unavailable` | Temporary unavailability. |

### 4.4 Error Handling

Rate limiting and service unavailability errors use the standard `Error` schema. The endpoint SHOULD NOT return `401 Unauthorized` or `403 Forbidden` since no authentication is required.

---

## 5. Example Interactions

### 5.1 Full Platform Capabilities

**Request:**

```http
GET /capabilities HTTP/1.1
Host: merchant.example.com
API-Version: 2026-01-30
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=3600

{
  "protocol": {
    "name": "acp",
    "version": "2026-01-30",
    "supported_versions": ["2025-09-29", "2025-12-12", "2026-01-16", "2026-01-30"],
    "documentation_url": "https://agenticcommerce.dev"
  },
  "extensions": [
    { "name": "discount", "spec": "https://agenticcommerce.dev/specs/discount" },
    { "name": "fulfillment", "spec": "https://agenticcommerce.dev/specs/fulfillment" }
  ],
  "intervention_types": ["3ds", "biometric", "address_verification"],
  "services": ["checkout", "orders", "delegate_payment"],
  "supported_currencies": ["usd", "eur", "gbp"],
  "supported_locales": ["en-US", "fr-FR", "de-DE"]
}
```

### 5.2 Minimal Response (Checkout Only)

**Response:**

```json
{
  "protocol": {
    "name": "acp",
    "version": "2025-09-29",
    "supported_versions": ["2025-09-29"]
  },
  "services": ["checkout"]
}
```

### 5.3 Agent Decision Flow

An agent uses discovery to make an informed decision before starting a checkout:

1. Agent calls `GET /capabilities` on the merchant's base URL.
2. Agent receives a `200` response — the merchant supports ACP.
3. Agent checks `protocol.supported_versions` to confirm its preferred API version is listed.
4. Agent checks `services` to confirm `"checkout"` is available.
5. Agent checks `extensions` to see if `"discount"` is supported, informing whether to include discount codes in the checkout request.
6. Agent proceeds to `POST /checkout_sessions` with its inline capabilities for session-level negotiation.

If the agent receives a `404` or non-JSON response, it knows the merchant does not support ACP and should use an alternative channel.

---

## 6. Relation to Capability Negotiation

Discovery and capability negotiation are complementary mechanisms at different scopes:

| Aspect | Discovery (`GET /capabilities`) | Capability Negotiation (`POST /checkout_sessions`) |
|---|---|---|
| **Scope** | Platform-level | Session-level |
| **Authentication** | None required | Bearer token required |
| **Content** | Protocol version, extensions, services | Payment methods, payment handlers, intervention intersection |
| **Variability** | Stable across merchants and sessions | Varies per merchant, per session, per rollout state |
| **Cacheability** | Cacheable (hours to days) | Per-session only |
| **Purpose** | "Can I use ACP here?" | "What works for this transaction?" |

Discovery does not replace inline capabilities. An agent that calls `GET /capabilities` still MUST include the `capabilities` object in `POST /checkout_sessions` for session-level negotiation.

---

## 7. Security and Privacy

### 7.1 No Sensitive Data

The discovery response contains only platform-level metadata. It MUST NOT include:

- Merchant identifiers or configuration
- Payment handler details or PSP routing
- Buyer or customer information
- Authentication tokens or keys

### 7.2 Rate Limiting

Implementations SHOULD apply rate limiting to prevent abuse. The endpoint is unauthenticated, making it a potential target for scraping or denial-of-service. Standard `429 Too Many Requests` responses with `Retry-After` headers are RECOMMENDED.

### 7.3 Information Disclosure

The response reveals which ACP features a platform supports. This is considered public, non-sensitive information comparable to publishing an OpenAPI spec. Implementations SHOULD NOT include information that could be used for merchant fingerprinting or competitive intelligence.

---

## 8. Backward Compatibility

This is a purely additive change:

- **New endpoint**: `GET /capabilities` is a new path that does not conflict with any existing endpoints.
- **New schemas**: `DiscoveryResponse`, `DiscoveryProtocol`, and `DiscoveryExtension` are new schemas that do not modify any existing schemas.
- **No changes to existing flows**: The `POST /checkout_sessions` flow and its inline capability negotiation are completely unchanged.

Agents that do not use discovery continue to work exactly as before. Discovery is an optional pre-flight check.

---

## 9. Required Spec Updates

- [ ] `spec/unreleased/openapi/openapi.agentic_checkout.yaml` — Add `GET /capabilities` path and `DiscoveryResponse`, `DiscoveryProtocol`, `DiscoveryExtension` schemas
- [ ] `spec/unreleased/json-schema/schema.agentic_checkout.json` — Add `DiscoveryResponse`, `DiscoveryProtocol`, `DiscoveryExtension` to `$defs`
- [ ] `examples/unreleased/examples.agentic_checkout.json` — Add discovery response examples
- [ ] `changelog/unreleased/discovery-capabilities-endpoint.md` — Changelog entry

---

## 10. Conformance Checklist

**MUST requirements:**

- [ ] MUST implement `GET /capabilities` returning a valid `DiscoveryResponse`
- [ ] MUST NOT require authentication for `GET /capabilities`
- [ ] MUST include `protocol` and `services` in the response
- [ ] MUST return `protocol.name` as `"acp"`
- [ ] MUST return `protocol.version` as a valid `YYYY-MM-DD` date string
- [ ] MUST return `protocol.supported_versions` as a non-empty array

**SHOULD requirements:**

- [ ] SHOULD include a `Cache-Control` response header
- [ ] SHOULD include `extensions` when the platform supports extensions
- [ ] SHOULD include `intervention_types` when the platform supports interventions
- [ ] SHOULD include `supported_currencies` and `supported_locales` when known
- [ ] SHOULD apply rate limiting to the endpoint

**MAY requirements:**

- [ ] MAY include `documentation_url` in the protocol object
- [ ] MAY include `spec` URLs on extension declarations
- [ ] MAY vary the response based on the `API-Version` request header

---

## 11. Future Extensions

This RFC provides a foundation for future discovery enhancements:

- **MCP tool name advertisement**: Declaring canonical MCP tool names for agents that consume ACP via Model Context Protocol.
- **Webhook capabilities**: Advertising supported webhook event types and delivery mechanisms.
- **Authentication methods**: Declaring supported authentication mechanisms (e.g., OAuth 2.0 identity linking) when those capabilities are added to ACP.
- **Service-level metadata**: Adding per-service configuration (e.g., maximum line items, supported fulfillment types) as the platform's feature set grows.

---

## 12. Change Log

- **2026-02-11**: Initial proposal for platform-level discovery endpoint.
