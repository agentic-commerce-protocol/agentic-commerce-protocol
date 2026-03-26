# Unreleased Changes

## Email Marketing Consent on Checkout Complete (SEP #195)

Add marketing consent support to enable sellers to offer opt-in marketing subscriptions at checkout completion.

### Changes

- **MarketingConsentOption**: New schema for seller-declared consent options (type, description, privacy_policy_url)
- **MarketingConsent**: New schema for agent-submitted consent choices (type, opted_in)
- **CheckoutSessionBase**: Added optional `marketing_consent_options` array field
- **CheckoutSessionCompleteRequest**: Added optional `marketing_consents` array field

### Benefits

- **Privacy-compliant**: Consent is explicit opt-in with privacy policy links (GDPR/CAN-SPAM compliant)
- **Seller-declared**: Sellers define available consent types; agents present them to buyers
- **Contact-scoped**: Consent applies to fulfillment_details contact info (email, phone)
