# SEP: Markdown Content Specification (CommonMark)

## SEP Metadata

- **SEP Number**: TBD
- **Status**: `proposal`
- **Type**: [x] Major Change [ ] Process Change
- **Related Issues/RFCs**: `rfcs/rfc.agentic_checkout.md`

---

## Abstract

ACP defines a `content_type` field with values `"plain"` and `"markdown"` on four message types (Disclosure, MessageInfo, MessageWarning, MessageError), but the specification does not define what "markdown" means. There is no normative reference to a markdown dialect, no restriction on raw HTML, and no guidance for agents rendering markdown content.

This ambiguity creates a cross-site scripting (XSS) risk: because standard Markdown permits inline HTML, seller-authored markdown could contain `<script>`, `<iframe>`, or event-handler attributes that execute in the agent's rendering context. It also creates an interoperability gap -- different parsers (GFM, Markdown.pl, CommonMark) produce different output from identical input.

This SEP adopts [CommonMark](https://spec.commonmark.org/0.31.2/) as the normative markdown standard for all `content_type: "markdown"` fields in ACP and explicitly disallows raw HTML elements. It establishes a shared responsibility model: sellers author compliant content, the server validates and rejects non-conforming input, and agents render using CommonMark-compliant parsers with HTML output disabled.

---

## Motivation

ACP's checkout specification uses markdown to convey rich content -- legal disclosures, informational messages, warnings, and errors -- from sellers to agents and ultimately to buyers. Markdown is the right tool for this: it is lightweight, human-readable, and widely supported. However, ACP currently treats "markdown" as a black box:

* **No dialect specified.** The `content_type: "markdown"` enum value does not reference any standard. Different markdown dialects disagree on edge cases (e.g., nested emphasis, link parsing, HTML handling), which means the same seller content can render differently across agents.

* **Raw HTML is implicitly permitted.** Standard Markdown and most dialects allow arbitrary inline HTML. A seller could include `<script>alert('xss')</script>` in a disclosure field, and the spec provides no basis for rejecting it. If an agent renders this content in a web context without sanitization, it becomes an XSS vector.

* **No rendering guidance for agents.** Agents have no specification-level guidance on which parser to use, whether to allow HTML output, or how to handle malformed input. This makes it difficult to build secure, interoperable implementations.

* **No validation basis for the server.** Without a formal spec, the server has no standard against which to validate inbound markdown content. It cannot distinguish valid from invalid markdown, and it cannot reject content that poses a security risk.

As ACP scales beyond a small set of trusted agents and sellers, these gaps become increasingly dangerous. A formal markdown specification is needed to close them.

---

## Specification

This PR includes the following spec changes:

**New files:**

* `docs/sep-markdown-specification.md` -- this SEP
* `changelog/unreleased/markdown-specification.md` -- changelog entry

**Modified files:**

* `spec/unreleased/json-schema/schema.agentic_checkout.json` -- updated `content_type` and `content` field descriptions on Disclosure, MessageInfo, MessageWarning, and MessageError to reference CommonMark and disallow raw HTML
* `spec/unreleased/openapi/openapi.agentic_checkout.yaml` -- same description updates mirrored
* `rfcs/rfc.agentic_checkout.md` -- added Markdown Content Specification subsection to the Data Model section

**Key design decisions:**

* **CommonMark 0.31.2 as normative reference** -- a stable, vendor-neutral, formally specified markdown standard with broad tooling support and a comprehensive conformance test suite.

* **Raw HTML MUST be disallowed** -- sellers MUST NOT include raw HTML elements in markdown content. The server MUST reject content containing raw HTML. Agents MUST render with HTML output disabled or sanitized. This eliminates the XSS attack surface at the protocol level.

* **No new schema fields** -- the semantic constraint is applied to the existing `content_type: "markdown"` enum value through enhanced field descriptions. This avoids schema churn and keeps the API surface stable.

* **Conformance language follows RFC 2119/8174** -- matching the normative language conventions already established in the ACP specification.

**Affected fields:**

The following four types carry `content_type` and `content` fields that are constrained by this specification:

| Type | Description |
|------|-------------|
| Disclosure | Legal disclosures or terms on line items that must be acknowledged by the buyer |
| MessageInfo | Informational messages from the seller (non-blocking) |
| MessageWarning | Warning messages with structured codes (non-blocking) |
| MessageError | Error messages with structured codes (blocking) |

For each type, when `content_type` is `"markdown"`:

* The `content` field MUST contain valid CommonMark as defined by [the CommonMark specification, version 0.31.2](https://spec.commonmark.org/0.31.2/).
* The `content` field MUST NOT contain raw HTML elements (as defined in [CommonMark Section 6.6 — Raw HTML](https://spec.commonmark.org/0.31.2/#raw-html)).
* Agents MUST render the content using a CommonMark-compliant parser with raw HTML output disabled or sanitized.

When `content_type` is `"plain"`, the `content` field is plain text with no formatting semantics.

**Shared responsibility model:**

| Party | Responsibility |
|-------|---------------|
| **Sellers** | Author markdown content that conforms to CommonMark without raw HTML elements |
| **Server (seller)** | Validate inbound markdown and reject content containing raw HTML (the gateway enforcement point) |
| **Agents** | Render markdown using a CommonMark-compliant parser with raw HTML output disabled or sanitized (defense-in-depth) |

---

## Rationale

**Why CommonMark instead of GitHub Flavored Markdown (GFM)?**
GFM is a superset of CommonMark maintained by a single vendor (GitHub). It adds tables, task lists, strikethrough, and autolinks -- features that are not relevant to ACP's disclosure and messaging use cases. Adopting CommonMark is strictly more conservative: it provides the smallest reasonable standard specification, and GFM extensions can be added incrementally in follow-up SEPs if needed. CommonMark is vendor-neutral and governed by the original contributors to Markdown.

**Why not define a custom markdown subset?**
A bespoke allowlist (e.g., "only bold, italic, links, and lists") would require building and maintaining a custom parser/validator with no community tooling support. Edge cases and parsing ambiguities are inevitable without a formal grammar. External partners (agents, sellers) would have no standard to point to. CommonMark provides all of this out of the box.

**Why disallow raw HTML rather than sanitize it?**
HTML sanitization is complex, error-prone, and parser-dependent. Different sanitizers make different choices about which elements and attributes to allow, creating inconsistent behavior across implementations. Disallowing raw HTML entirely is simpler to specify, validate, and implement. It eliminates the XSS attack surface completely rather than attempting to manage it. Most CommonMark parsers support disabling raw HTML natively (e.g., `cmark` with `CMARK_OPT_SAFE`, `markdown-it` with `html: false`).

**Why not add a new `markdown_specification` schema field?**
Adding a field would increase schema complexity and require version negotiation between agents and sellers. It is unnecessary since ACP currently supports only one markdown dialect. The constraint is best expressed through enhanced field descriptions -- matching ACP's existing convention of using normative language in descriptions (e.g., the RFC 9535 JSONPath reference on the `param` field). If a future SEP introduces alternative dialects, the `content_type` enum can be extended (e.g., `"commonmark"`, `"gfm"`).

**Why pin to CommonMark version 0.31.2?**
Pinning to a specific version ensures deterministic behavior: all implementations target the same specification. Floating to "latest" would mean the ACP spec's semantics change whenever CommonMark publishes an update, potentially without review. Version updates can be proposed as lightweight follow-up SEPs.

---

## Backward Compatibility

This is a non-breaking change that formalizes the semantics of an existing enum value:

* **No structural schema changes.** No fields are added, removed, or renamed. The `content_type` enum values (`"plain"`, `"markdown"`) are unchanged.
* **Compliant content is unaffected.** Sellers already producing valid CommonMark without raw HTML require no changes.
* **Non-compliant content is affected.** Sellers currently including raw HTML in markdown fields will need to remove it. This is expected to be rare, as markdown content in practice consists of headings, emphasis, links, and lists.
* **Migration path.** The server can implement a warning period before enforcing rejection -- logging non-conforming content before returning HTTP 422 errors. This gives sellers time to audit and update their content.

No deprecation timeline is needed since no existing feature is being removed.

---

## Reference Implementation

Not yet available. The field description updates in this PR serve as the normative specification from which implementations can be built.

Compliant CommonMark parsers that support disabling raw HTML output include:

* **JavaScript**: `commonmark.js` (with `safe: true`), `markdown-it` (with `html: false`)
* **C**: `cmark` (with `CMARK_OPT_SAFE`)
* **Rust**: `comrak` (with `unsafe_: false`)
* **Python**: `commonmark` (with `safe` mode), `markdown-it-py`
* **Go**: `goldmark` (with `html.WithUnsafe()` omitted)

The [CommonMark conformance test suite](https://spec.commonmark.org/0.31.2/spec.json) can be used to validate parser compliance.

---

## Security Implications

This SEP directly addresses a cross-site scripting (XSS) risk in ACP's markdown content fields.

* **Attack vector eliminated.** Raw HTML injection vectors -- `<script>`, `<iframe>`, `<img onerror>`, `<a onclick>`, and similar -- are blocked at the protocol level. Sellers MUST NOT include them; the server MUST reject them.

* **Defense-in-depth.** Agents MUST render with HTML output disabled even though the server should have already rejected raw HTML upstream. This provides protection against edge cases during validation rollout or implementation gaps.

* **No new attack surface.** This SEP constrains existing behavior; it does not introduce new endpoints, authentication flows, or data storage. The security posture strictly improves.

* **Compliance.** Formalizing the markdown specification provides an auditable standard for security reviews and compliance assessments.

---

## Pre-Submission Checklist

- [ ] I have created a GitHub Issue with the `SEP` and `proposal` tags
- [ ] I have linked the SEP issue number above
- [ ] I have discussed this proposal in the community (Discord/GitHub Discussions)
- [x] I have signed the Contributor License Agreement (CLA)
- [x] This PR includes updates to OpenAPI/JSON schemas
- [ ] This PR includes example requests/responses (if applicable)
- [x] This PR includes a changelog entry file in `changelog/unreleased/markdown-specification.md`
- [ ] I am seeking or have found a sponsor (Founding Maintainer)

---

## Additional Context

The CommonMark specification was chosen after evaluating three alternatives: GitHub Flavored Markdown (broader but vendor-controlled), a custom restricted subset (maximum control but high maintenance burden), and CommonMark (formally specified, vendor-neutral, broad ecosystem). CommonMark is supported by the original contributors to Markdown and has compliant parser implementations in every major programming language.

The markdown fields in ACP are currently used for legal disclosures on line items and for seller-to-agent messaging (info, warnings, errors). These use cases require basic formatting (emphasis, links, lists) but do not require HTML-level expressiveness, making CommonMark with raw HTML disallowed a natural fit.

Agents such as Microsoft Copilot already use CommonMark-based rendering internally, so adoption friction is expected to be minimal.

---

## Questions for Reviewers

1. **Version pinning**: Should the spec reference a specific CommonMark version (0.31.2) or "the latest stable release"? Pinning is more predictable; floating is more future-proof.
2. **Rejection strictness**: Should server-side rejection of raw HTML be a MUST (hard reject, HTTP 422) or a SHOULD (recommended, with a warning period)?
3. **Parser recommendations**: Should the spec recommend specific CommonMark parser libraries per language, or is the reference to the CommonMark specification sufficient?
4. **Raw HTML use cases**: Are there legitimate use cases for raw HTML in disclosures or messages that this proposal would break?
