# Unreleased Changes

## Suggested Pricing on Checkout Create (SEP #197)

Add suggested_price to Item on CheckoutSessionCreateRequest, enabling agents to communicate price provenance to sellers for catalog price matching.

### Changes

- **PriceSource**: New schema with feed_id (required), channel, feed_update_id, and updated_at fields
- **SuggestedPrice**: New schema with amount, structured source (PriceSource), and observed_at fields
- **Item**: Added optional `suggested_price` field

### Benefits

- **Price consistency**: Sellers can honor catalog prices displayed to buyers, reducing checkout price discrepancies
- **Structured provenance**: Feed ID, channel, update version, and timestamp enable sellers to validate price claims against specific feed updates
- **Seller-controlled policy**: Time window and source verification are seller-defined, not protocol-mandated
