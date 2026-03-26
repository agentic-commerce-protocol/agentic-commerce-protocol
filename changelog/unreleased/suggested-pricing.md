# Unreleased Changes

## Suggested Pricing on Checkout Create (SEP #197)

Add suggested_price to Item on CheckoutSessionCreateRequest, enabling agents to communicate price provenance to sellers for catalog price matching.

### Changes

- **SuggestedPrice**: New schema with amount, source, and observed_at fields
- **Item**: Added optional `suggested_price` field

### Benefits

- **Price consistency**: Sellers can honor catalog prices displayed to buyers, reducing checkout price discrepancies
- **Verifiable provenance**: Source and timestamp enable sellers to validate price claims against their own catalog feeds
- **Seller-controlled policy**: Time window and source verification are seller-defined, not protocol-mandated
