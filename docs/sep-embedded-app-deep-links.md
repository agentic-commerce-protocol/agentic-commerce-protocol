# SEP: Embedded App Deep Links for Product Feeds

## 📋 SEP Metadata

- **Author(s)**: Ryan Kelly (PayPal, Inc.)
- **Status**: `proposal` (awaiting sponsor)
- **Type**: [x] Major Change [ ] Process Change
- **Related Issues/RFCs**: [SEP #189](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/189) — Product Feeds, [SEP #190](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/190) — Add Product Feeds API

---

## 🎯 Abstract

This SEP extends the **Product** and **Variant** schemas introduced in [SEP #189](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/189) by adding an optional **app_links** field. **app_links** provides platform-specific deep link URIs that allow ACP-compatible answer engine clients (e.g. ChatGPT) to launch a native or embedded application experience instead of loading the product's **url** in a webview.

---

## 💡 Motivation

[SEP #189](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/189) introduces **url** on **Product** and **Variant** as a canonical product page URL, implicitly assuming a webview rendering path. However, answer engine clients like ChatGPT are increasingly capable of hosting **embedded native app experiences**. Loading a webview for checkout is a degraded experience when a richer, intent-aware native path exists.

ACP should adopt a deep link pattern so that:

1. **Merchants can express a preferred native checkout path** without overloading the **url** field.
2. **Answer engine clients can select the richest available experience** — native embedded app → webview fallback — using a priority-ordered link list.
3. **The fallback chain is always safe**: if no **app_links** entry matches the client's capabilities, the client falls back to **url** as today.

---

## 📐 Specification

### New field: `app_links` on `Product` and `Variant`

```json
"app_links": {
  "type": "array",
  "description": "Platform-specific deep link URIs for launching a native or
    embedded app experience. Evaluated in order; first matching entry wins.
    Falls back to `url` if no entry matches.",
  "items": { "$ref": "./schema.app_link.json" }
}
```

### New schema: `AppLink`

| Field | Type | Required | Description |
|---|---|---|---|
| `platform` | string (enum) | Yes | Target answer engine platform. See enum values below. |
| `uri` | string (uri) | Yes | Deep link URI. Scheme must match the merchant's registered scheme at app registration time (e.g. `merchant://`). If the scheme is not recognized, the client falls back to the product or variant `url`. |

#### `platform` enum values

| Value | Meaning |
|---|---|
| `chatgpt` | ChatGPT embedded app URI using the merchant's registered scheme |
| `other` | Catch-all; `uri` is evaluated as-is |

### URI Scheme Conventions

The URI scheme in an **app_links** entry **MUST** match the custom scheme the merchant registered with the answer engine at app submission time. This ensures scheme authority is enforced at the registry level rather than at runtime.

> **Note: Answer Engine App Registration**
> Answer engines such as ChatGPT are expected to provide a registration mechanism as part of their app submission or developer portal process. When a merchant submits their app to an answer engine for publishing, the submission flow should include a field to declare the app's URI scheme (e.g. `merchant://`). The answer engine records this as the canonical scheme for that merchant's app, and client implementations use it to validate `app_links` entries at runtime. This is analogous to how Apple's App Store and the Google Play Store require developers to declare Universal Link domains and App Link intent filters at submission time. The specifics of each answer engine's registration process are outside the scope of this SEP and are defined by the respective platform.
>
> **Alignment with the merchant push model ([SEP #190](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/190)):** [SEP #190](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/190) establishes that the Feed API follows a merchant push model — merchants push their product catalog directly to the answer engine. `app_links` integrates naturally into this model: when a merchant pushes their feed, they include `app_links` entries alongside their product data. Because the answer engine already holds the merchant's registered URI scheme from app submission, it can validate the `app_links[].uri` scheme against that registration at ingest time rather than at runtime, providing an additional layer of integrity checking with no extra round-trips.

Scheme formatting conventions:

- Lowercase only
- Hyphen-separated words (e.g. `merchant-name://`, not `merchant_name://`)
- No trademark symbols or special characters beyond hyphens

### Resolution Algorithm for Clients

```
1. Filter app_links to entries where platform matches the current client.
2. If one or more entries match, use the first matching entry's uri.
3. If the client cannot open that uri (scheme not registered),
   fall back to the product/variant url.
4. If no app_links entry matches, use url as today.
```

This ensures the field is **purely additive and safe** — clients that ignore **app_links** continue to use **url** with no behavior change.

### Updated `Product` Schema (partial diff)

```json
// BEFORE (SEP #189)
"url": {
  "type": "string",
  "format": "uri",
  "description": "Canonical product URL."
}

// AFTER (this SEP, additive)
"url": {
  "type": "string",
  "format": "uri",
  "description": "Canonical product URL. Used as the default webview target
    and the final fallback when no app_links entry applies."
},
"app_links": {
  "type": "array",
  "description": "Ordered list of platform-specific deep link targets.
    Evaluated before `url`.",
  "items": { "$ref": "./schema.app_link.json" }
}
```

The same change applies identically to **Variant**.

### Example Payload

```json
{
  "id": "prod_123",
  "title": "Performance Running Shoe",
  "url": "https://merchant.com/products/prod_123",
  "app_links": [
    {
      "platform": "chatgpt",
      "uri": "merchant://checkout/prod_123"
    }
  ],
  "variants": [
    {
      "id": "var_123_blue_9",
      "title": "Blue / 9",
      "price": { "amount": 11900, "currency": "USD" },
      "availability": { "available": true, "status": "in_stock" }
    }
  ]
}
```

---

## 🤔 Rationale

**Why not overload `url` with deep link logic?**
The `url` field is defined as a canonical URI and is already used for webview rendering. Overloading it with deep link semantics would break existing clients and create ambiguity about when a URI should be opened in a webview vs. handed to the answer engine.

**Why a `platform` enum rather than a free-form string?**
A closed enum ensures interoperable behavior across answer engines. The `other` escape hatch allows experimentation without breaking the schema.

**Why ordered evaluation rather than priority scores?**
Ordered arrays are simpler to reason about and avoid tie-breaking ambiguity.

**Why is the merchant's registered scheme the authority?**
Tying the URI scheme to the merchant's answer engine app registration means scheme identity is verified out-of-band at submission time, not at runtime. This prevents one merchant from crafting a product feed entry that deep-links into another merchant's app.

**Why not a separate endpoint?**
App links are product-level metadata, not a separate resource. Embedding them in the product object keeps catalog data co-located and avoids an extra round-trip.

---

## 🔄 Backward Compatibility

- **app_links** is optional on both **Product** and **Variant**.
- Clients that do not recognize **app_links** continue to use **url** unchanged.
- Servers that do not support **app_links** simply omit the field; clients fall back to **url**.
- No existing endpoints, schemas, or behaviors are modified.

---

## 🛠️ Reference Implementation

This SEP requires the following additions to the unreleased ACP specification:

- `spec/unreleased/json-schema/schema.app_link.json` (new)
- Updated `spec/unreleased/json-schema/schema.feed.json` (Product and Variant `$defs`)
- Updated `examples/unreleased/examples.feed.json`
- `changelog/unreleased/product-app-links.md` (new)

---

## 🔒 Security Implications

**Scheme squatting**
Because the URI scheme is enforced against the merchant's registered scheme at app submission, a malicious actor cannot submit a product feed entry claiming `merchant://` unless they control the registered `merchant` app for that answer engine. Clients **SHOULD** verify the scheme in `uri` matches the merchant's registered scheme before invoking it.

---

## ✅ Pre-Submission Checklist

Before submitting this SEP PR, ensure:

- [x] I have created a GitHub Issue with the `SEP` and `proposal` tags
- [x] I have linked the SEP issue number above
- [ ] I have discussed this proposal in the community (Discord/GitHub Discussions)
- [x] I have signed the [Contributor License Agreement (CLA)](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/legal/cla/INDIVIDUAL.md)
- [x] This PR includes updates to OpenAPI/JSON schemas (if applicable)
- [x] This PR includes example requests/responses (if applicable)
- [x] This PR includes a changelog entry file in `changelog/unreleased/product-app-links.md`
- [x] I am seeking or have found a sponsor (Founding Maintainer)

---

## 📚 Additional Context

This SEP is intentionally scoped to answer engine clients only. iOS and Android deep link patterns (Universal Links, App Links) are out of scope; the `other` enum value exists as an escape hatch for experimentation but is not expected to cover mobile OS deep linking.

This proposal does not change how checkout sessions are initiated. `app_links` is pre-purchase catalog metadata that tells an answer engine client how to launch the merchant's embedded app experience — what happens inside that experience (checkout, payment, etc.) is governed by existing ACP checkout flows.

---

## 🙋 Questions for Reviewers

1. Should `chatgpt` be a first-class enum value, or should answer engine entries use a generic `agent` platform value with a `vendor` discriminator, keeping the spec client-agnostic?
2. Should the resolution algorithm be normative (MUST) or advisory (SHOULD)?
3. Should the spec mandate a scheme naming convention (lowercase, hyphen-separated) or leave that to implementer documentation?

---

**Note**: SEPs require unanimous approval from Founding Maintainers. See [governance.md](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/docs/governance.md) and [sep-guidelines.md](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/docs/sep-guidelines.md) for the full process.
