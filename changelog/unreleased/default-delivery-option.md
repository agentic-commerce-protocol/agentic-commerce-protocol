# Unreleased Changes

## Default Delivery Option on Checkout Create (SEP #194)

Add `is_default` boolean to fulfillment option types, enabling sellers to indicate a pre-selected delivery option on checkout create.

### Changes

- **FulfillmentOptionShipping**: Added optional `is_default` boolean field
- **FulfillmentOptionPickup**: Added optional `is_default` boolean field
- **FulfillmentOptionLocalDelivery**: Added optional `is_default` boolean field

### Benefits

- **Eliminates unnecessary round trip**: Agents no longer need a separate update call to select the default shipping option before displaying checkout
- **Consistent UX**: Buyers see a pre-selected delivery option immediately on checkout load
