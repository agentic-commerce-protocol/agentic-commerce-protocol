# Razorpay Payment Handlers

**Added** – `in.razorpay.upi` and `in.razorpay.reserve_pay` payment handlers for Indian payments.

## New PSP Support

Added `razorpay` to the list of supported Payment Service Provider identifiers in `psp` field enum.

## Razorpay UPI Handler (`in.razorpay.upi`)

Unified Payments Interface (UPI) handler for Indian payments supporting:
- **Collect flow**: Merchant-initiated UPI collect requests
- **Intent flow**: App-to-app UPI intent-based payments
- **UPI Number**: Payments to UPI number/ID
- **QR Code**: Scan-and-pay QR code payments

**Configuration:**
- `merchant_id`: Razorpay merchant key (`rzp_live_*` or `rzp_test_*`)
- `accepted_flows`: Array of supported UPI flows
- `environment`: `sandbox` or `production`

## Razorpay Reserve Pay Handler (`in.razorpay.reserve_pay`)

Tokenized payment handler supporting Razorpay Reserve Pay for multiple payment instruments:
- **Card**: Credit/debit card tokenization
- **UPI**: UPI ID tokenization
- **NetBanking**: Bank transfer tokenization
- **Wallet**: Digital wallet tokenization
- **PayLater**: Buy-now-pay-later tokenization

**Configuration:**
- `merchant_id`: Razorpay merchant key (`rzp_live_*` or `rzp_test_*`)
- `accepted_instruments`: Array of supported payment instruments
- `environment`: `sandbox` or `production`

**Backward compatible:** Additive only. New handlers follow existing `capabilities.payment.handlers` pattern. Existing implementations ignore unknown handlers.

**Schema Updates:**
- `spec/unreleased/json-schema/schema.agentic_checkout.json`: Added PSP enum and config schemas
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`: Added PSP enum and config schemas

**Examples:** `examples/unreleased/examples.agentic_checkout.json`

## Example Handler Declarations

```json
{
  "id": "razorpay_upi",
  "name": "in.razorpay.upi",
  "display_name": "UPI",
  "version": "2026-04-06",
  "spec": "https://acp.dev/handlers/razorpay/upi",
  "requires_delegate_payment": true,
  "requires_pci_compliance": false,
  "psp": "razorpay",
  "config": {
    "merchant_id": "rzp_live_abc123xyz",
    "psp": "razorpay",
    "accepted_flows": ["collect", "intent", "upi_number", "qr_code"],
    "environment": "production"
  }
}
```

```json
{
  "id": "razorpay_reserve_pay",
  "name": "in.razorpay.reserve_pay",
  "display_name": "Reserve Pay",
  "version": "2026-04-06",
  "spec": "https://acp.dev/handlers/razorpay/reserve_pay",
  "requires_delegate_payment": true,
  "requires_pci_compliance": false,
  "psp": "razorpay",
  "config": {
    "merchant_id": "rzp_live_abc123xyz",
    "psp": "razorpay",
    "accepted_instruments": ["card", "upi", "netbanking", "wallet", "paylater"],
    "environment": "production"
  }
}
```
