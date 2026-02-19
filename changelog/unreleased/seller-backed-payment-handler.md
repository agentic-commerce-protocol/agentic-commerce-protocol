# Seller-backed payment

**Added** – `dev.acp.seller_backed` payment handler pattern and four handler types: `saved_card`, `gift_card`, `points`, `store_credit`.

Sellers can declare payment options in `capabilities.payment.handlers` that are resolved on the seller's backend without credential transfer. All use `requires_delegate_payment: true` and `requires_pci_compliance: false`. Tokenization via `delegate_payment` preserves audit trail and observability.

**Backward compatible:** Additive only; no schema or API changes. Existing implementations ignore unknown handlers.

**RFC:** `rfcs/rfc.seller_backed_payment_handler.md`  
**Examples:** `examples/2026-01-30/examples.agentic_checkout.json`, `examples/unreleased/examples.agentic_checkout.json`
