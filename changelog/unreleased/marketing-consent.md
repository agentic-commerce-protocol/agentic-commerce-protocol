# Unreleased Changes

## Marketing Consent Support

Add marketing consent support to enable sellers to offer opt-in marketing subscriptions during checkout.

## New Schemas

- **MarketingConsentOption**: Seller-declared consent option with `channel` (open enum, e.g. email, sms, whatsapp),
  `description`, `privacy_policy_url`, and optional `is_subscribed` boolean for returning buyers.
- **MarketingConsent**: Agent-submitted consent decision with `channel` and `opted_in` boolean.

## CheckoutSession Changes

- **`marketing_consent_options`** added as an optional array on `CheckoutSessionBase`. Sellers
  include this to signal available marketing channels and the buyer's existing subscription status.
- **`marketing_consents`** added as an optional array on `CheckoutSessionCompleteRequest`. Agents
  include the buyer's consent decisions for each option surfaced.

## Marketing Channel Resolution

- For email consent: seller uses `buyer.email` (primary) or `fulfillment_details.email` (fallback).
- For SMS/WhatsApp consent: seller uses `buyer.phone_number` (primary) or
  `fulfillment_details.phone_number` (fallback).

## Design Notes

- Consent is captured at complete checkout time only — not during checkout updates.
- `is_subscribed` lets sellers communicate existing subscription status so agents render the
  correct default (pre-checked for returning subscribers, unchecked for new buyers).
- Agents MAY selectively surface a subset of options; unsurfaced options are omitted from the
  response, preserving existing subscription state.
- Omission of `marketing_consents` in the complete request preserves all existing subscriptions.
- Sellers who do not want to risk accidental revocation should omit the channel from
  `marketing_consent_options`.

**Files changed:**

- `spec/unreleased/json-schema/schema.agentic_checkout.json` (new schemas and fields)
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml` (new schemas and fields)
- `examples/unreleased/examples.agentic_checkout.json` (consent examples)
