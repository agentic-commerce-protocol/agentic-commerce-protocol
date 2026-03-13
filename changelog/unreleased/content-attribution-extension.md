## Content Citation Attribution Extension

New `content_attribution` extension for ACP checkout sessions, enabling URL-based content attribution alongside the existing `affiliate_attribution` extension.

### Changes
- New `content_attribution` extension object on `CheckoutSessionCreateRequest` and `CheckoutSessionCompleteRequest`
- Tracks content URLs retrieved and cited by AI shopping agents during purchase conversations
- Includes optional citation quality signals (`citation_type`, `position`, `excerpt_tokens`, `content_hash`)
- Lightweight `conversation_summary` with `turn_count` and `topics` for aggregate context
- Write-only semantics matching `affiliate_attribution` pattern
- Multi-touch attribution (first-touch at Create, last-touch at Complete)
- Forward-compatible: all nested objects allow additional properties

### Files Added
- `rfcs/rfc.content_attribution.md`
- `spec/unreleased/json-schema/schema.content_attribution.json`
- `examples/unreleased/content-attribution/create_checkout_with_attribution.json`
- `examples/unreleased/content-attribution/combined_affiliate_and_content.json`
- `changelog/unreleased/content-attribution-extension.md`

### Reference
- SEP: #148
- PR: #149
