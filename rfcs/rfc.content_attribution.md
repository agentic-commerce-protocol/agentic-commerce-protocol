# RFC: Content Citation Attribution Extension

## Abstract

This SEP defines a `content_attribution` extension for ACP checkout sessions. When an AI shopping agent retrieves and cites content during a purchasing conversation, the extension provides a standardised structure for recording which content URLs were accessed and referenced. This enables merchants and their affiliate networks to attribute purchases to the content that influenced the buying decision.

The mechanism is URL-based: agents record the URIs of content they fetched and cited, and merchants forward these to their affiliate networks for publisher resolution. This complements the existing `affiliate_attribution` RFC, which handles network-level attribution through pre-wired publisher mappings. Where `affiliate_attribution` requires prior relationship setup, `content_attribution` bootstraps attribution from raw URLs -- no pre-configuration needed. The two layers can coexist in a single checkout session.

The extension follows a strict write-only, privacy-preserving model. Attribution data flows from agent to merchant and is never echoed in read responses. No personally identifiable information is collected; `content_scope` values are opaque identifiers. This design allows attribution to function without exposing the agent's reasoning or the buyer's browsing behaviour.

## Motivation

AI shopping agents routinely read reviews, buying guides, and product comparisons to form purchase recommendations. Currently there is no standardised mechanism to track which content influenced a given purchase.

The existing `affiliate_attribution` RFC addresses network-level attribution by conveying `provider`, `publisher_id`, and cryptographic `token` fields from agent to merchant. This works well when the affiliate relationship is already established -- the agent knows which network, which publisher, and has a pre-issued token to prove it.

In practice, agentic commerce breaks this assumption. An agent performing RAG-based product research:

1. Fetches `https://www.wirecutter.com/reviews/best-headphones` via its content index
2. Paraphrases the review in its recommendation to the user
3. Proceeds to checkout

At no point does the agent know that Wirecutter is `pub_123` on `impact.com`, or possess a network-issued attribution token. The agent has **URLs** -- that is the primitive it naturally works with. The `affiliate_attribution` schema requires **network identifiers** -- primitives the agent does not have.

`content_attribution` solves this bootstrapping problem by starting from what the agent actually knows:

1. **Agent emits URLs** -- the agent records which content it retrieved and cited during the shopping conversation.
2. **Merchant's affiliate network resolves URLs to publishers** -- the network matches content URLs against its publisher registry.
3. **Standard affiliate crediting kicks in** -- once the publisher is identified, existing affiliate commission structures apply.

These are complementary layers, not competing ones. A single checkout can include both `affiliate_attribution` (network-level, pre-wired) and `content_attribution` (content-level, URL-based). The former covers known affiliate relationships; the latter bootstraps attribution for content the agent discovered organically. Over time, as affiliate networks build agent-facing APIs that issue tokens in real time, `affiliate_attribution` becomes more viable -- but `content_attribution` provides the immediate, zero-configuration path that works today.

## Specification

### Extension Declaration

```json
{
  "name": "content_attribution",
  "schema": "https://agentic-commerce-protocol.com/schemas/content_attribution.json",
  "spec": "https://agentic-commerce-protocol.com/rfcs/content_attribution",
  "extends": [
    "$.CheckoutSessionCreateRequest.content_attribution",
    "$.CheckoutSessionCompleteRequest.content_attribution"
  ]
}
```

The extension name follows ACP convention (short names, matching `affiliate_attribution`). The schema and spec URLs use the ACP-controlled `agentic-commerce-protocol.com` namespace. This schema is the ACP binding of [OpenAttribution Telemetry v0.4](https://openattribution.org/telemetry); the canonical specification is protocol-independent and maintained by the OpenAttribution Project.

### The `content_attribution` Object

The `content_attribution` object is included in `CheckoutSessionCreateRequest` and `CheckoutSessionCompleteRequest` payloads.

#### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content_scope` | string | No | Opaque identifier for the content collection used by the agent |
| `content_retrieved` | array | Yes | Content URLs fetched during the session |
| `content_cited` | array | No | Content explicitly referenced in agent responses |
| `conversation_summary` | object | No | Lightweight conversation context (agent-reported hints) |

#### `content_retrieved` Array Items

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content_url` | string (URI) | Yes | URI of content retrieved |
| `timestamp` | string (ISO 8601) | Yes | UTC timestamp of retrieval |

#### `content_cited` Array Items

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content_url` | string (URI) | Yes | URI of content cited |
| `timestamp` | string (ISO 8601) | Yes | UTC timestamp of citation |
| `citation_type` | string | No | How the content was used: `direct_quote`, `paraphrase`, `reference`, or `contradiction` |
| `excerpt_tokens` | integer | No | Token count of the cited excerpt |
| `position` | string | No | Prominence in the response: `primary`, `supporting`, or `mentioned` |
| `content_hash` | string | No | SHA-256 hash of the content the agent processed from this URL (format: `sha256:{hex}`) |

#### `conversation_summary` Object

| Field | Type | Description |
|-------|------|-------------|
| `turn_count` | integer | Number of conversation turns before checkout (minimum 1) |
| `topics` | array of strings | De-duplicated free-form topic tags from the conversation |

Both fields are agent-reported hints. `turn_count` provides a signal of conversation depth that is not derivable from the citation arrays. `topics` provides lightweight category tags that help merchants route attribution internally without needing to crawl the cited URLs.

### Write-Only Semantics

The `content_attribution` object MUST NOT be echoed in read responses (e.g. `GET /checkout-sessions/{id}`). This matches the pattern established by `affiliate_attribution` and prevents sensitive attribution data from leaking through session queries.

### Multi-Touch Attribution

The extension attaches to both `CheckoutSessionCreateRequest` (first-touch) and `CheckoutSessionCompleteRequest` (last-touch). When provided at both stages:

- **Create** captures content that influenced the initial cart decisions
- **Complete** captures content that influenced the final purchase confirmation

Merchants SHOULD store both touchpoints separately. Attribution networks determine weighting between first-touch and last-touch based on their own models.

If `content_attribution` is provided only at one stage, merchants store it for that touchpoint alone.

Content attribution follows the checkout session's idempotency semantics. If a request is retried with the same `Idempotency-Key`, identical `content_attribution` data is accepted idempotently; mismatched data results in `409 Conflict`.

### Error Handling

Structural validation errors in `content_attribution` SHOULD return `400 Bad Request`:

| Code | Condition |
|------|-----------|
| `invalid_uri` | A `content_url` value is not a valid URI |
| `pii_not_allowed` | `content_scope` or other fields contain personally identifiable information |

Attribution-specific errors MUST NOT prevent checkout completion. If `content_attribution` fails validation, merchants SHOULD log the error and proceed with the checkout.

### Conformance Requirements

**MUST:**

- Agents MUST include at least one entry in `content_retrieved` when providing `content_attribution`.
- Merchants MUST accept and store `content_attribution` when declared as a supported extension.
- Merchants MUST NOT include `content_attribution` in session read responses.
- Merchants MUST NOT block or reject a checkout session due to malformed or invalid `content_attribution` data. Attribution errors are logged, not surfaced to the buyer.

**SHOULD:**

- Agents SHOULD include `content_cited` entries for content that directly influenced the recommendation.
- Agents SHOULD use stable `content_scope` values across sessions to enable aggregation.
- Agents SHOULD NOT include more than 100 entries in `content_retrieved` or 50 entries in `content_cited`.
- Merchants SHOULD reject `content_scope` values that contain obvious PII.

## Rationale

**URLs as the primitive.** AI agents naturally have URLs -- they fetch content by URL and can trivially record what they accessed. Unlike affiliate tokens or publisher IDs, URLs require no pre-configuration. The merchant's affiliate network can resolve URLs to publishers after the fact, which is the key insight that makes this extension work without prior relationship setup.

**Write-only semantics.** Attribution data flows in one direction: from agent to merchant. Exposing it in read responses would create a privacy risk (leaking the agent's content sources) and a competitive risk (revealing which content influences purchases). The write-only pattern mirrors `affiliate_attribution` for consistency.

**Field alignment with `affiliate_attribution`.** The extension intentionally mirrors the structural patterns of `affiliate_attribution` so that merchants can process both through similar pipelines. The additional fields (`citation_type`, `excerpt_tokens`, `position`, `content_hash`) provide quality signals specific to content citation that have no analogue in network-level affiliate tracking.

**Minimal conversation context.** `conversation_summary` is limited to `turn_count` and `topics` — two signals that are genuinely not derivable from the citation arrays. Conversation depth and topic tags help merchants route attribution internally without requiring them to crawl cited URLs. Subjective classification fields were excluded to avoid inconsistency across agent implementations.

## Backward Compatibility

This extension is purely additive. Existing checkout sessions without `content_attribution` continue to work unchanged. Merchants that do not declare support for `content_attribution` will simply not receive the extension data.

## Forward Compatibility

New optional fields MAY be added to `content_attribution` in future versions. Validators SHOULD be lenient with unknown fields -- implementations MUST NOT reject payloads containing unrecognised fields.

## Reference Implementation

A Python SDK providing the `session_to_content_attribution()` bridge function is available at [https://github.com/openattribution-org/telemetry](https://github.com/openattribution-org/telemetry). The function converts an OpenAttribution telemetry session into a `content_attribution` dict suitable for inclusion in ACP checkout requests.

```python
from openattribution.telemetry import session_to_content_attribution

content_attribution = session_to_content_attribution(telemetry_session)
```

The JSON Schema for the `content_attribution` object is published alongside this RFC.

## Security Considerations

- **Citation quality signals are agent-reported, not trusted assertions.** The `citation_type`, `position`, and `excerpt_tokens` fields reflect the agent's self-report of how it used content. Merchants and attribution systems should treat these as hints, not verified facts.
- **`content_hash` provides an integrity audit trail.** The hash is a SHA-256 of the content the agent processed from the cited URL. It ties the citation to a specific version of the content the agent saw, which is useful for dispute resolution when attribution involves commission payments. The spec does not prescribe the extraction method — agents hash whatever content they fed into their context. Agents SHOULD use a consistent hashing method across citations within a session.
- **`content_scope` MUST NOT contain PII.** Implementations must use opaque, non-identifying values for this field.
- **Rate limiting.** Merchants should apply rate limiting to prevent abuse of the attribution channel (e.g. an agent flooding `content_retrieved` with spurious URLs to game attribution).
- **Write-only semantics prevent data leakage.** By never echoing `content_attribution` in read responses, the extension prevents third parties from discovering which content influenced a purchase.
- **Replay prevention.** `content_attribution` is bound to the checkout session. Replaying a payload on a different session has no effect if merchants validate session identity.
- **URL manipulation.** Agents could fabricate `content_url` values to game attribution. Merchants SHOULD cross-reference URLs against known publisher registries before crediting attribution.
- **Timestamp cross-referencing.** Merchants can cross-reference `content_retrieved` timestamps against `content_cited` timestamps: an agent cannot legitimately cite content before retrieving it. Anomalous timestamp patterns (citation before retrieval, implausibly fast retrieval-to-citation gaps) are fraud indicators.
- **Array size limits.** Merchants SHOULD enforce reasonable limits on `content_retrieved` and `content_cited` array sizes (see conformance requirements) to prevent abuse.
