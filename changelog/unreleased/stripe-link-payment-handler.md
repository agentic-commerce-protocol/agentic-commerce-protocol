# Stripe Link payment handler

**Added** – `com.stripe.link` accelerated-checkout payment handler.

Sellers can declare Stripe Link as a payment handler in `capabilities.payment.handlers`. Link handles buyer authentication and credential selection directly — the agent never handles raw payment credentials. The agent delegates the Link token via `delegate_payment` to obtain an SPT, keeping payment tracking and referral fees consistent across all handlers. Uses `requires_delegate_payment: true` and `requires_pci_compliance: false`.

This is the first accelerated-checkout handler in ACP, establishing a pattern for wallet-type handlers where credential acquisition varies by wallet but delegation always flows through `delegate_payment`.

**Backward compatible:** Additive only; no schema or API changes. Existing implementations ignore unknown handlers.

**SEP:** `docs/SEP_STRIPE_LINK_PAYMENT_HANDLER.md`
**Issue:** #141
