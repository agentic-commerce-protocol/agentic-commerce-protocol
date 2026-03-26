# Unreleased Changes

## Fulfillment Details on Checkout Complete (SEP #196)

Add fulfillment_details to CheckoutSessionCompleteRequest, enabling agents to batch contact-only changes with payment submission.

### Changes

- **CheckoutSessionCompleteRequest**: Added optional `fulfillment_details` field

### Benefits

- **Eliminates unnecessary round trip**: Contact-only changes (name, email, phone) no longer require a separate update call before complete
- **Reduced checkout latency**: One API call instead of two at the most critical moment in the checkout flow
- **Address safeguard**: Address changes trigger 409 Conflict, forcing the agent back to the update-then-complete flow
