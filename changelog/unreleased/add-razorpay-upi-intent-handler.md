## Add Razorpay UPI Intent Payment Handler

This change adds support for UPI Intent payments as a checkout option within the Agentic Commerce Protocol (ACP). UPI (Unified Payments Interface) is India's real-time payment system with 500M+ users and 20B+ monthly transactions. This handler enables buyers to complete payment by launching their preferred UPI app via a deep link on mobile or scanning a QR code on desktop.

### Key Features

- **500M+ UPI Users** — Access India's dominant digital payment method
- **Zero PCI-DSS Scope** — VPA-based addressing; no card data touches any system
- **OS-Native App Selection** — Android implicit intents and iOS URL schemes present available UPI apps automatically
- **Desktop QR Fallback** — Cross-device payment via QR code scanning
- **Real-time Settlement** — Instant NPCI confirmation with webhook notification
- **Credential-on-Escalation Flow** — Uses existing ACP requestCheckout() and complete_checkout MCP tool

### Handler Details

- **Handler Name**: `com.razorpay.upi.intent`
- **Version**: `2026-04-07`
- **ACP Version**: `2025-09` (GA) and later
- **Currency Support**: `INR` only
- **Checkout Type**: `instant` with credential execution (escalation)
- **Maximum Transaction**: ₹1,00,000 (bank-configurable per NPCI)

### Integration Flow

The handler follows a credential-on-escalation flow:

1. **Widget calls `requestCheckout`** with `payment_type: upi_intent`
2. **Platform calls merchant MCP tool** to request credential
3. **Merchant creates Razorpay Order** and generates NPCI-compliant intent URI
4. **Merchant returns `requires_escalation`** response with credential containing:
   - `intent_uri` — UPI deep link for mobile execution
   - `qr_code_data` — Base64 PNG for desktop
   - `qr_code_string` — URI string for QR generation
5. **Platform executes based on device context**:
   - **Android**: Launch `upi://` scheme via implicit intent
   - **iOS**: Open via `UIApplication.shared.open()`
   - **Desktop/Web**: Render QR code from image or generate from string
6. **Platform polls** for payment completion (max 5-second intervals)
7. **Razorpay webhook** hits merchant backend
8. **Platform calls `complete_checkout`** with UPI-specific payment confirmation

### Changes

- Added JSON Schema for UPI Intent handler configuration with merchant VPA and environment
- Added credential schema with NPCI-compliant intent URI format, QR code support, and expiry handling
- Added payment provider schema extension (`name: "razorpay"`, `payment_type: "upi_intent"`)
- Added complete_checkout MCP tool payload with UPI-specific confirmation fields
- Added comprehensive error handling with NPCI response code mapping
- Added examples for Android, iOS, WebView, and desktop QR code execution patterns

### Files Updated

- `spec/unreleased/json-schema/schema.razorpay_upi_intent.json` (new file)
- `examples/unreleased/examples.razorpay_upi_intent.json` (new file)

### Platform Requirements

- **Device Detection**: Distinguish mobile (Android/iOS) from desktop
- **UPI Deep Linking**: Support `upi://` scheme navigation
- **QR Rendering**: Display base64 data URI images or generate QR from string
- **Status Polling**: Poll every 5 seconds (NPCI best practice)
- **Fallback Support**: Use `continue_url` if handler not implemented

### Security Considerations

- **Credential Binding**: Credentials bound to checkout via `transaction_reference`
- **No Sensitive Data in URI**: Intent URI contains only merchant VPA, amount, transaction reference
- **Credential Expiry**: Intent URIs expire within 15 minutes (NPCI best practice)
- **Webhook Verification**: HMAC-SHA256 signature with timestamp-based replay protection
- **Data Residency**: All payment records stored in India per RBI mandate
- **NPCI Compliance**: Implements UPI Linking Specification with generic implicit intent support
- **HTTPS Required**: All API communication uses TLS 1.2+
- **Idempotency**: Transaction references not processed twice

### NPCI UPI Linking Specification Compliance

- Generic/implicit intent calls supported (mandatory per NPCI)
- Targeting specific TPAPs (explicit intent) optional only
- URL encoding: Spaces as `%20` per RFC 3986
- Transaction reference: Max 35 alphanumeric characters
- Mode `04` = Intent, `05` = Merchant QR

### Error Handling

| NPCI Code | ACP Code | Description | Resolution |
|-------------|----------|---------------|------------|
| ZM | payment_declined | User declined in UPI app | Offer retry |
| Z9 | insufficient_funds | Insufficient funds | Suggest adding funds |
| U28 | merchant_configuration_error | Merchant VPA misconfigured | Contact merchant support |
| U30 | payment_declined | Bank-side debit failure | Retry in 5 minutes |
| ZA | limit_exceeded | Daily/per-txn limit exceeded | Try tomorrow |
| BT | network_error | NPCI network unavailable | Retry in 15 minutes |
| - | payment_timeout | Buyer didn't complete | Generate new credential |

### Example Usage

**Mobile Execution (Android)**:
```java
Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(credential.intent_uri));
startActivity(intent);
```

**Desktop Execution (QR Code)**:
```javascript
<img src={credential.qr_code_data} alt="Scan to pay via UPI" />
// or generate from string
QRCode.toCanvas(canvas, credential.qr_code_string, { width: 256 });
```

### Reference

- **PR**: #<pr-number>
- **Handler Spec**: https://razorpay.com/acp/upi_intent/2026-04-07/
- **NPCI UPI Linking Spec**: https://www.npci.org.in/what-we-do/upi/product-overview
- **Android UPI Intent Guide**: https://developers.google.com/pay/india/api/android/in-app-payments
- **Author**: Razorpay Software Private Ltd
- **Contact**: himanshu.shekhar@razorpay.com
