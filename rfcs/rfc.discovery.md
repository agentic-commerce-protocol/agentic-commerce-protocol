# RFC: Agentic Checkout — Discovery

**Status:** Proposal  
**Version:** unreleased  
**Scope:** Platform-level discovery document for the Agentic Commerce Protocol

This RFC introduces a well-known discovery document (`/.well-known/acp.json`) for the **Agentic Commerce Protocol (ACP)**. The document allows agents to determine whether a platform supports ACP, which protocol version is available, what transports are offered, and what high-level capabilities the platform provides, all before creating a checkout session and without requiring authentication.

---

## 1. Motivation

The Agentic Commerce Protocol's capability negotiation (see `rfc.capability_negotiation.md`) enables rich, session-level negotiation between agents and sellers during checkout session creation. However, agents currently have no way to answer a more fundamental question: **"Does this platform support ACP at all?"**

Without a discovery mechanism:

- **Blind first requests**: Agents must attempt `POST /checkout_sessions` and interpret failure responses to determine if a platform even supports ACP. This creates unnecessary sessions and wastes API calls.
- **Version ambiguity**: Agents have no way to determine the supported API version before making a request, potentially leading to version mismatch errors on the first call.
- **No feature overview**: Agents cannot know which high-level extensions or services a platform supports (e.g., orders, discounts, delegate payment) without starting a transaction.
- **No base URL bootstrapping**: Agents need the full API base URL to make any ACP call. Without discovery, the base URL must be communicated entirely out-of-band.
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
2. **Base URL bootstrapping**: Allow agents to discover the API base URL from just a domain name.
3. **No authentication required**: The document MUST be publicly accessible without a Bearer token.
4. **Cacheability**: Responses SHOULD be cacheable to avoid redundant requests for stable information.
5. **Platform-scoped**: Return information that is consistent across all merchants on the platform.
6. **Simplicity**: Keep the document schema minimal and focused on information that helps agents decide whether and how to interact with the platform.

### 2.2 Non-Goals

- **Merchant-specific discovery**: Capabilities that vary per merchant (payment methods, payment handlers, PSP configurations) are out of scope. These are negotiated via the `capabilities` object on `POST /checkout_sessions`.
- **Session-level negotiation**: This document does not replace or duplicate the inline capability exchange. It provides a higher-level overview.
- **Product or catalog discovery**: Discovering what a merchant sells (products, inventory, pricing) is out of scope.
- **Agent registration or whitelisting**: Agent identity and authorization are separate concerns (see GitHub Issue #15).
- **Merchant identification**: The discovery document is platform-scoped. It MUST NOT accept or return `merchant_id` or any merchant-specific identifiers. Because the document is unauthenticated, exposing merchant identity would allow anyone to enumerate which merchants exist on a platform, creating a fingerprinting and enumeration risk.

---

## 3. Design Rationale

### 3.1 Why platform-level, not merchant-level?

ACP is typically deployed through a platform intermediary (e.g., Stripe) that hosts the ACP server on behalf of many merchants. In this model:

- **One base URL serves many merchants** with heterogeneous capabilities.
- **Merchant identity is established through authentication** (Bearer token), which is unavailable at discovery time.
- **Merchant-specific capabilities are not deterministic**: they may be subject to feature flags, gradual rollouts, A/B testing, or session-context rules.

Platform-level information (protocol version, supported extensions, available services) is stable and shared across all merchants. This is the appropriate scope for an unauthenticated discovery document.

### 3.2 Why `.well-known` instead of a dedicated API endpoint?

Discovery solves a bootstrapping problem: agents need to learn the API base URL before they can call any endpoint. A `/.well-known/acp.json` document at the origin root solves this because:

1. **Agents only need a domain**: Given `acp.stripe.com`, an agent fetches `https://acp.stripe.com/.well-known/acp.json` and discovers the API base URL, supported versions, and capabilities in a single request. No prior knowledge of the API path structure is needed.
2. **RFC 8615 precedent**: Well-known URIs are the established standard for protocol-level discovery. OpenID Connect (`/.well-known/openid-configuration`), OAuth 2.0 Authorization Server Metadata (`/.well-known/oauth-authorization-server`), and Matrix (`/.well-known/matrix/server`) all use this pattern.
3. **Static document**: The content is platform-level metadata that changes infrequently. It can be served as a static file by a CDN or web server with no application logic required.

### 3.3 Why not include payment methods?

Payment method availability is:

1. **Merchant-specific**: Merchant A may accept Visa and Mastercard; Merchant B may accept only Apple Pay.
2. **Feature-flagged**: A merchant may be rolling out a new payment method at 10% of transactions.
3. **Context-dependent**: Available payment methods may vary based on order amount, buyer location, or item type.

Including payment methods in a platform-level, unauthenticated document would be either inaccurate (showing the union) or misleading (showing a subset). Session-level negotiation is the correct mechanism.

---

## 4. Specification

### 4.1 Document Location

```
/.well-known/acp.json
```

The document MUST be served at the origin root per RFC 8615. For a platform hosted at `https://acp.stripe.com`, the document URL is `https://acp.stripe.com/.well-known/acp.json`.

**Content-Type**: `application/json`

**Authentication**: None required. The document MUST be publicly accessible without a Bearer token.

**Caching**: Implementations SHOULD include a `Cache-Control` response header with a minimum of `public, max-age=3600`. Platform capabilities do not change frequently; without cache guidance, agents will either re-fetch on every checkout flow (unnecessary load) or cache too aggressively (stale data after version upgrades). Implementations SHOULD NOT update the document more frequently than once per hour.

### 4.2 Response Schema

The document is a `DiscoveryResponse` object containing the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `protocol` | `DiscoveryProtocol` | Yes | Protocol identification and version information. |
| `api_base_url` | `string` (URI) | Yes | Base URL for the ACP REST API. Agents append resource paths to this URL. |
| `transports` | `string[]` | Yes | Transport bindings supported by this platform (e.g., `["rest"]` or `["rest", "mcp"]`). See [SEP #135](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/135) for the MCP transport binding. |
| `capabilities` | `DiscoveryCapabilities` | Yes | Platform-level capabilities. |

#### DiscoveryProtocol

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Protocol identifier. Always `"acp"`. |
| `version` | `string` | Yes | Current (latest) API version, in `YYYY-MM-DD` format. |
| `supported_versions` | `string[]` | Yes | All API versions the platform supports, in chronological order (oldest first). The last element is always the latest supported version. |
| `documentation_url` | `string` (URI) | No | URL to the platform's ACP documentation. |

#### DiscoveryCapabilities

| Field | Type | Required | Description |
|---|---|---|---|
| `services` | `string[]` | Yes | High-level ACP services implemented by the platform. |
| `extensions` | `DiscoveryExtension[]` | No | Extensions the platform supports at a high level. |
| `intervention_types` | `string[]` | No | Intervention types available on the platform. |
| `supported_currencies` | `string[]` | No | ISO 4217 currency codes supported by the platform. |
| `supported_locales` | `string[]` | No | BCP 47 locale tags supported for localized responses. |

#### DiscoveryExtension

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Extension identifier (e.g., `"discount"`, `"fulfillment"`). |
| `spec` | `string` (URI) | No | URL to the extension's specification document. |
| `schema` | `string` (URI) | No | URL to the extension's JSON Schema definition for programmatic validation. |

#### Services Enum Values

| Value | Description |
|---|---|
| `checkout` | Checkout session management (`POST /checkout_sessions` and related endpoints). |
| `orders` | Post-purchase order lifecycle management. |
| `delegate_payment` | Payment credential delegation (`POST /delegate_payment`). |

The `services` enum is closed per API version. New values are introduced in new API versions. Agents MAY treat the set as exhaustive for a given version.

#### Transports Enum Values

| Value | Description |
|---|---|
| `rest` | REST API at the URL specified by `api_base_url`. |
| `mcp` | Model Context Protocol server (see [SEP #135](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/135)). |

The `transports` enum is closed per API version. New values are introduced in new API versions.

#### Intervention Types Enum Values

| Value | Description |
|---|---|
| `3ds` | 3D Secure authentication. |
| `biometric` | Biometric verification (fingerprint, Face ID, etc.). |
| `address_verification` | Address verification service. |

The `intervention_types` enum is closed per API version. New values are introduced in new API versions. Agents MAY treat the set as exhaustive for a given version.

### 4.3 HTTP Status Codes

| Code | Description |
|---|---|
| `200 OK` | Success. Returns `DiscoveryResponse`. |
| `404 Not Found` | Platform does not support ACP. |
| `429 Too Many Requests` | Rate limit exceeded. |
| `503 Service Unavailable` | Temporary unavailability. |

### 4.4 Error Handling

Rate limiting and service unavailability responses SHOULD include a `Retry-After` header. A `404` response indicates the platform does not support ACP; agents SHOULD NOT retry.

---

## 5. Example Interactions

### 5.1 Full Platform Discovery

**Request:**

```http
GET /.well-known/acp.json HTTP/1.1
Host: acp.stripe.com
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
  "api_base_url": "https://acp.stripe.com/api",
  "transports": ["rest", "mcp"],
  "capabilities": {
    "services": ["checkout", "orders", "delegate_payment"],
    "extensions": [
      { "name": "discount", "spec": "https://agenticcommerce.dev/specs/discount", "schema": "https://agenticcommerce.dev/schemas/discount.json" },
      { "name": "fulfillment", "spec": "https://agenticcommerce.dev/specs/fulfillment", "schema": "https://agenticcommerce.dev/schemas/fulfillment.json" }
    ],
    "intervention_types": ["3ds", "biometric", "address_verification"],
    "supported_currencies": ["usd", "eur", "gbp"],
    "supported_locales": ["en-US", "fr-FR", "de-DE"]
  }
}
```

### 5.2 Minimal Response (Checkout Only)

```json
{
  "protocol": {
    "name": "acp",
    "version": "2025-09-29",
    "supported_versions": ["2025-09-29"]
  },
  "api_base_url": "https://merchant.example.com/api",
  "transports": ["rest"],
  "capabilities": {
    "services": ["checkout"]
  }
}
```

### 5.3 Agent Decision Flow

An agent uses discovery to bootstrap its interaction with a platform:

1. Agent knows the platform domain (e.g., `acp.stripe.com`).
2. Agent fetches `https://acp.stripe.com/.well-known/acp.json`.
3. Agent receives a `200` response: the platform supports ACP.
4. Agent reads `api_base_url` to learn where to send API requests.
5. Agent checks `protocol.supported_versions` to confirm its preferred API version is listed.
6. Agent checks `capabilities.services` to confirm `"checkout"` is available.
7. Agent checks `capabilities.extensions` to see if `"discount"` is supported, informing whether to include discount codes in the checkout request.
8. Agent checks `transports` to determine whether to use REST or MCP.
9. Agent proceeds to `POST {api_base_url}/checkout_sessions` with its inline capabilities for session-level negotiation.

If the agent receives a `404` or non-JSON response at step 2, it knows the platform does not support ACP and should use an alternative channel.

---

## 6. Relation to Capability Negotiation

Discovery and capability negotiation are complementary mechanisms at different scopes:

| Aspect | Discovery (`/.well-known/acp.json`) | Capability Negotiation (`POST /checkout_sessions`) |
|---|---|---|
| **Scope** | Platform-level | Session-level |
| **Authentication** | None required | Bearer token required |
| **Content** | Protocol version, services, extensions, transports | Payment methods, payment handlers, intervention intersection |
| **Variability** | Stable across merchants and sessions | Varies per merchant, per session, per rollout state |
| **Cacheability** | Cacheable (hours to days) | Per-session only |
| **Purpose** | "Can I use ACP here? Where is the API?" | "What works for this transaction?" |

Discovery does not replace inline capabilities. An agent that reads `/.well-known/acp.json` still MUST include the `capabilities` object in `POST /checkout_sessions` for session-level negotiation.

---

## 7. Security and Privacy

### 7.1 No Sensitive Data

The discovery document contains only platform-level metadata. It MUST NOT include:

- Merchant identifiers or configuration
- Payment handler details or PSP routing
- Buyer or customer information
- Authentication tokens or keys

### 7.2 Rate Limiting

Implementations SHOULD apply rate limiting to prevent abuse. The document is publicly accessible, making it a potential target for scraping or denial-of-service. Standard `429 Too Many Requests` responses with `Retry-After` headers are RECOMMENDED.

### 7.3 Information Disclosure

The document reveals which ACP features a platform supports. This is considered public, non-sensitive information comparable to publishing an OpenAPI spec. Implementations SHOULD NOT include information that could be used for merchant fingerprinting or competitive intelligence.

### 7.4 Merchant Enumeration

The discovery document is intentionally platform-scoped. It MUST NOT accept or return merchant identifiers. Because the document is unauthenticated, exposing merchant-level information would allow anyone to enumerate which merchants exist on a platform, creating fingerprinting and competitive intelligence risks.

---

## 8. Backward Compatibility

This is a purely additive change:

- **New document**: `/.well-known/acp.json` is a new resource that does not conflict with any existing endpoints or paths.
- **New schemas**: `DiscoveryResponse`, `DiscoveryCapabilities`, `DiscoveryProtocol`, and `DiscoveryExtension` are new schemas that do not modify any existing schemas.
- **No changes to existing flows**: The `POST /checkout_sessions` flow and its inline capability negotiation are completely unchanged.

Agents that do not use discovery continue to work exactly as before. Discovery is an optional pre-flight check.

---

## 9. Required Spec Updates

- [ ] `spec/unreleased/json-schema/schema.agentic_checkout.json` — Add `DiscoveryResponse`, `DiscoveryCapabilities`, `DiscoveryProtocol`, `DiscoveryExtension` to `$defs`
- [ ] `examples/unreleased/examples.agentic_checkout.json` — Add discovery response examples
- [ ] `changelog/unreleased/discovery-well-known.md` — Changelog entry
- [ ] `docs/mcp-binding.md` — Cross-reference discovery document for transport advertisement

---

## 10. Conformance Checklist

**MUST requirements:**

- [ ] MUST serve `/.well-known/acp.json` at the origin root returning a valid `DiscoveryResponse`
- [ ] MUST NOT require authentication for the discovery document
- [ ] MUST include `protocol`, `api_base_url`, `transports`, and `capabilities` in the document
- [ ] MUST return `protocol.name` as `"acp"`
- [ ] MUST return `protocol.version` as a valid `YYYY-MM-DD` date string
- [ ] MUST return `protocol.supported_versions` as a non-empty array in chronological order (oldest first)
- [ ] MUST include at least `"rest"` in `transports`
- [ ] MUST include `services` within `capabilities`

**SHOULD requirements:**

- [ ] SHOULD include a `Cache-Control` response header with at least `public, max-age=3600`
- [ ] SHOULD include `extensions` when the platform supports extensions
- [ ] SHOULD include `intervention_types` when the platform supports interventions
- [ ] SHOULD include `supported_currencies` and `supported_locales` when known
- [ ] SHOULD apply rate limiting to the document
- [ ] SHOULD NOT update the document more frequently than once per hour

**MAY requirements:**

- [ ] MAY include `documentation_url` in the protocol object
- [ ] MAY include `spec` URLs on extension declarations
- [ ] MAY include `"mcp"` in `transports` when a Model Context Protocol server is available

---

## 11. Future Extensions

This RFC provides a foundation for future discovery enhancements:

- **Webhook capabilities**: Advertising supported webhook event types and delivery mechanisms.
- **Authentication methods**: Declaring supported authentication mechanisms (e.g., OAuth 2.0 identity linking) when those capabilities are added to ACP.
- **Service-level metadata**: Adding per-service configuration (e.g., maximum line items, supported fulfillment types) as the platform's feature set grows.
- **Transport endpoint discovery**: Structured transport objects with per-transport endpoint URLs (e.g., `{"type": "rest", "url": "..."}`, `{"type": "mcp", "url": "..."}`), enabling agents to discover MCP and other transport endpoints directly from the discovery document. Deferred pending MCP binding finalization (SEP #135).
- **Signing keys**: Public key advertisement (JWK format) for signature verification, enabling agents to verify the authenticity of responses. Deferred pending formalization of ACP's request signing specification.

---

## 12. Change Log

- **2026-02-11**: Initial proposal for platform-level discovery via `GET /capabilities`.
- **2026-02-23**: Switched to `/.well-known/acp.json` per RFC 8615 based on reviewer feedback. Added `api_base_url`, `transports` fields. Wrapped capabilities in a `capabilities` object. Added closed-enum versioning guidance for `services`, `intervention_types`, and `transports`. Added `merchant_id` enumeration risk to non-goals. Added minimum `Cache-Control` recommendation. Added cross-reference to SEP #135 (MCP Transport Binding).
