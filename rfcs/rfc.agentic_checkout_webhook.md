# RFC: Agentic Checkout Webhook Integration

**Status:** Draft  
**Version:** 2025-09-29  
**Scope:** Merchant-to-platform webhook delivery for order lifecycle events

This RFC provides implementation guidance for merchants sending order lifecycle events to AI agent platforms via webhooks. It complements the **Agentic Checkout Webhooks API** OpenAPI specification with additional context on authentication patterns, retry semantics, and operational considerations.

This specification aims to balance security, reliability, and implementation flexibility across diverse merchant technology stacks.

---

## 1. Scope & Goals

- Define **interoperability requirements** for webhook delivery between merchants and platforms.
- Provide **guidance on authentication patterns** including signature-based verification options.
- Establish **baseline expectations** for retry behavior and error handling.
- Enable merchants to leverage existing infrastructure while meeting platform integration needs.

**Out of scope:** Internal merchant order management systems, specific PSP implementations, customer notification workflows.

### 1.1 Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY** follow RFC 2119/8174.

---

## 2. Webhook Event Model

### 2.1 Actors

- **Merchant**: Sends webhook events when order state changes.
- **Platform**: Receives and validates webhook events; updates order state for end users.

### 2.2 Event Types

Merchants **SHOULD** emit the following event types:

| Event Type      | Description                                    |
| --------------- | ---------------------------------------------- |
| `order_create`  | Order successfully created after checkout      |
| `order_update`  | Order status changes or refunds processed      |

Platforms **MAY** define additional event types in future versions.

### 2.3 Order Status Values

The `status` field **SHOULD** use these standard values where applicable:

- `created`: Order placed; payment authorized
- `manual_review`: Order held for fraud or compliance review
- `confirmed`: Order cleared review; ready for fulfillment
- `canceled`: Order canceled before shipment
- `shipped`: Order dispatched; tracking available
- `fulfilled`: Order delivered to customer

Merchants **MAY** map their internal states to these values or propose additional states if needed.

---

## 3. Authentication and Integrity

### 3.1 Authentication Options

Platforms and merchants **MUST** agree on an authentication mechanism during integration. Common patterns include:

#### 3.1.1 Signature-Based Verification (Recommended)

Request signatures provide both authentication and integrity protection without requiring TLS client certificates.

**Key Exchange:** Merchants and platforms exchange signing credentials out-of-band before going live. Mechanisms include secure portal upload, encrypted email, or API-based key provisioning.

**Supported Algorithms (examples):**

| Algorithm       | Key Type   | Use Case                                      |
| --------------- | ---------- | --------------------------------------------- |
| HMAC-SHA256     | Symmetric  | Simple integration; shared secret             |
| HMAC-SHA512     | Symmetric  | Higher security margin; shared secret         |
| Ed25519         | Asymmetric | No shared secret; merchant keeps private key  |
| ECDSA (ES256)   | Asymmetric | No shared secret; merchant keeps private key  |

Platforms **SHOULD** document which algorithms they support. Merchants **SHOULD** choose the strongest algorithm their infrastructure supports.

#### 3.1.2 TLS Client Certificates (Alternative)

Merchants **MAY** use mutual TLS if supported by the platform. This approach eliminates the need for request signatures but requires certificate lifecycle management.

#### 3.1.3 API Keys (Basic)

For initial integrations or low-volume merchants, platforms **MAY** accept `Authorization: Bearer <token>` headers. This approach **SHOULD** be combined with IP allowlisting for additional security.

### 3.2 Signature Format (for signature-based auth)

When using signature-based authentication, merchants **SHOULD** follow this general pattern:

1. **Construct signed string:** Combine timestamp, request body, and any other agreed-upon elements
2. **Compute signature:** Apply the agreed algorithm (e.g., HMAC-SHA256)
3. **Format header:** Include version, timestamp, and signature in a parseable format
4. **Add to request:** Send as a custom header (e.g., `<MerchantName>-Signature`)

**Example Header Format:**
```
<MerchantName>-Signature: <version>,<timestamp>,<signature>
```

Where:
- `version`: Algorithm version (e.g., `v1` for HMAC-SHA256)
- `timestamp`: Unix timestamp (seconds since epoch)
- `signature`: Hex or base64-encoded signature

Platforms and merchants **SHOULD** agree on the exact format during integration.

### 3.3 Timestamp Validation

To prevent replay attacks, platforms **SHOULD** reject requests with timestamps outside an acceptable window (e.g., ±5 minutes). The tolerance window **SHOULD** account for clock skew between systems.

### 3.4 Key Management

**Rotation:** Signing credentials **SHOULD** be rotated periodically. During rotation:
- Platforms **SHOULD** accept both old and new credentials for a grace period
- Merchants **SHOULD** provide advance notice before switching to new credentials

**Storage:** Credentials **MUST** be stored securely (e.g., secrets manager, HSM) and **MUST NOT** be logged or committed to version control.

---

## 4. Webhook Delivery

### 4.1 HTTP Request Structure

**Method:** `POST`

**Recommended Headers:**

| Header                    | Description                              | Required? |
| ------------------------- | ---------------------------------------- | --------- |
| `Content-Type`            | **MUST** be `application/json`           | Yes       |
| `<MerchantName>-Signature`| Signature header (if using signature auth)| Depends   |
| `Request-Id`              | Unique identifier for deduplication      | Recommended |
| `Timestamp`               | ISO 8601 / RFC 3339 timestamp            | Recommended |

**Request Body:** JSON conforming to `WebhookEvent` schema (see OpenAPI spec).

### 4.2 Response Codes

Platforms **SHOULD** return appropriate HTTP status codes:

| Status | Meaning                     | Merchant Action              |
| ------ | --------------------------- | ---------------------------- |
| 200    | Event accepted              | Consider delivery successful |
| 400    | Malformed payload           | Log error; do not retry      |
| 401    | Authentication failed       | Check credentials; do not retry |
| 409    | Duplicate event             | Consider delivery successful |
| 429    | Rate limited                | Retry with backoff           |
| 500    | Server error                | Retry with backoff           |
| 503    | Service unavailable         | Retry with backoff           |

### 4.3 Success Response Example

```json
{
  "received": true,
  "request_id": "req_01HV3P3..."
}
```

---

## 5. Retry Behavior and Resilience

### 5.1 Retry Recommendations

For transient failures (network errors, 429, 500, 503), merchants **SHOULD** implement retry logic with exponential backoff. Example schedule:

| Attempt | Suggested Delay | Cumulative Time |
| ------- | --------------- | --------------- |
| 1       | Immediate       | 0s              |
| 2       | 1-5 seconds     | ~3s             |
| 3       | 5-30 seconds    | ~15s            |
| 4       | 30s-2 minutes   | ~1 min          |
| 5       | 2-10 minutes    | ~5 min          |

Merchants **MAY** adjust timings based on their operational requirements and platform guidance.

### 5.2 Idempotency

- Merchants **SHOULD** use the same `Request-Id` for all retries of a given event
- Platforms **MUST** deduplicate events using `Request-Id` or a combination of `Request-Id` + `checkout_session_id`
- Duplicate events **SHOULD** return HTTP 200 or 409 (not an error condition)

### 5.3 Failed Delivery Handling

After exhausting retries, merchants **SHOULD**:
- Store failed events for manual inspection
- Alert operations teams
- Provide mechanisms to manually replay events after resolving issues

Platforms **SHOULD** provide status endpoints or dashboards showing recent webhook delivery status.

---

## 6. Operational Considerations

### 6.1 Event Ordering

Merchants **SHOULD** attempt to deliver events in chronological order per `checkout_session_id`, but platforms **MUST NOT** rely on strict ordering due to:
- Network retries and variability
- Distributed system delays
- Manual event replays

Platforms **SHOULD** use timestamp and status fields to resolve final order state.

### 6.2 Delivery Timing

Merchants **SHOULD** emit webhooks shortly after order state changes:
- `order_create`: Within 30-60 seconds of order creation
- `order_update`: Within reasonable time of status change

Platforms **SHOULD** be resilient to delayed webhook delivery.

### 6.3 Rate Limiting

Merchants **SHOULD** implement reasonable rate limiting to avoid overwhelming platforms. Platforms **SHOULD** document their rate limits and provide actionable error messages when limits are exceeded.

### 6.4 Monitoring and Observability

Merchants **SHOULD** monitor:
- Webhook delivery success rate
- Average delivery latency
- Retry frequency

Platforms **SHOULD** monitor:
- Webhook receipt rate
- Authentication failure rate
- Signature verification failures (possible security indicator)

### 6.5 Logging and Privacy

Both parties **SHOULD**:
- Log webhook attempts for debugging
- Redact PII (customer names, addresses, payment details) from logs
- Retain logs per their data retention policies

---

## 7. Security Considerations

### 7.1 Transport Security

- All webhook endpoints **MUST** use HTTPS with TLS 1.2 or higher
- Platforms **SHOULD** use valid, trusted certificates
- Merchants **SHOULD** validate certificates and reject self-signed certificates in production

### 7.2 Secret Protection

- Signing secrets and API keys **MUST** be stored securely
- Secrets **MUST NOT** appear in logs, error messages, or version control
- Access to secrets **SHOULD** be restricted to authorized personnel/systems only

### 7.3 Timing Attack Prevention

When verifying signatures, platforms **SHOULD** use constant-time comparison functions to prevent timing attacks.

### 7.4 Monitoring for Abuse

Platforms **SHOULD** monitor for:
- Sudden spike in authentication failures from a merchant (possible credential compromise)
- Unusual request patterns (possible security testing)
- Signature verification failures (possible man-in-the-middle attack)

---

## 8. Implementation Examples

### 8.1 Generating HMAC-SHA256 Signature (Python)

```python
import hmac
import hashlib
import json
import time

def generate_hmac_signature(payload: dict, secret: str) -> str:
    """Generate HMAC-SHA256 signature for webhook payload."""
    timestamp = int(time.time())
    canonical_body = json.dumps(payload, separators=(',', ':'), sort_keys=True)
    signed_string = f"{timestamp}.{canonical_body}"
    
    signature = hmac.new(
        secret.encode('utf-8'),
        signed_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return f"v1,{timestamp},{signature}"

# Example
payload = {
    "type": "order_create",
    "data": {
        "type": "order",
        "checkout_session_id": "cs_123",
        "permalink_url": "https://example.com/orders/123",
        "status": "created",
        "refunds": []
    }
}

signature = generate_hmac_signature(payload, "whsec_abc123...")
# Use as: Merchant-Signature: v1,1729349520,a3b2c1d4...
```

### 8.2 Verifying HMAC-SHA256 Signature (Node.js)

```javascript
const crypto = require('crypto');

function verifyHmacSignature(payload, signatureHeader, secret) {
    const [version, timestamp, receivedSig] = signatureHeader.split(',');
    
    // Check version
    if (version !== 'v1') {
        throw new Error('Unsupported signature version');
    }
    
    // Check timestamp (5 min tolerance)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) {
        throw new Error('Timestamp outside acceptable window');
    }
    
    // Recompute signature
    const canonicalBody = JSON.stringify(payload);
    const signedString = `${timestamp}.${canonicalBody}`;
    const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(signedString)
        .digest('hex');
    
    // Constant-time comparison
    if (!crypto.timingSafeEqual(
        Buffer.from(receivedSig, 'hex'),
        Buffer.from(expectedSig, 'hex')
    )) {
        throw new Error('Signature verification failed');
    }
    
    return true;
}
```

### 8.3 Using Ed25519 Signature (Alternative)

```python
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
import base64
import json
import time

def generate_ed25519_signature(payload: dict, private_key_pem: str) -> str:
    """Generate Ed25519 signature (asymmetric alternative)."""
    timestamp = int(time.time())
    canonical_body = json.dumps(payload, separators=(',', ':'), sort_keys=True)
    signed_string = f"{timestamp}.{canonical_body}"
    
    # Load private key
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode(), 
        password=None
    )
    
    # Sign
    signature = private_key.sign(signed_string.encode('utf-8'))
    signature_b64 = base64.b64encode(signature).decode('utf-8')
    
    return f"ed25519-v1,{timestamp},{signature_b64}"
```

---

## 9. Testing and Validation

### 9.1 Integration Testing Checklist

Merchants and platforms **SHOULD** validate:

- [ ] Signature generation/verification works with test credentials
- [ ] Timestamp validation rejects stale requests
- [ ] Idempotent delivery (same `Request-Id`) doesn't duplicate orders
- [ ] Retry logic follows reasonable backoff schedule
- [ ] All order status transitions trigger appropriate webhooks
- [ ] Refund events include correct amounts
- [ ] Authentication failures return HTTP 401
- [ ] Malformed payloads return HTTP 400

### 9.2 Test Endpoint Recommendations

Platforms **MAY** provide test endpoints that:
- Always return 200 (success case)
- Return 429 (rate limit - test retry logic)
- Return 500 (server error - test retry logic)
- Return 401 (auth failure - test error handling)

---

## 10. Conformance Guidance

### 10.1 Minimum Requirements (Merchants)

To be conformant, merchant implementations **MUST**:

- [ ] Send valid JSON payloads matching the OpenAPI schema
- [ ] Use HTTPS for all webhook delivery
- [ ] Include authentication credentials (per agreed mechanism)
- [ ] Emit `order_create` event when orders are created
- [ ] Emit `order_update` event when order status changes or refunds occur
- [ ] Handle HTTP 429, 500, 503 with retry logic
- [ ] Deduplicate requests using `Request-Id` on retry

### 10.2 Minimum Requirements (Platforms)

To be conformant, platform implementations **MUST**:

- [ ] Accept webhooks via HTTPS POST
- [ ] Validate authentication credentials
- [ ] Return HTTP 200 for successfully processed events
- [ ] Return HTTP 401 for authentication failures
- [ ] Return appropriate error codes for malformed requests
- [ ] Handle duplicate events gracefully (idempotency)
- [ ] Document supported authentication mechanisms
- [ ] Provide integration documentation and test credentials

---

## 11. Relationship to Other Specifications

This RFC complements:

- **OpenAPI: Agentic Checkout Webhooks API** (`openapi.agentic_checkout_webhook.yaml`): Defines HTTP endpoints and JSON schemas
- **RFC: Agentic Checkout** (`rfc.agentic_checkout.md`): Defines checkout session lifecycle that generates webhook events

---

## 12. Open Questions and Future Considerations

### 12.1 Topics for Discussion

- Should we standardize additional event types (e.g., `order_refund` separate from `order_update`)?
- What additional order statuses would be valuable (e.g., `partially_shipped`)?
- Should platforms provide webhook delivery status APIs for merchants to query?
- Would standard webhook testing tools (e.g., mock endpoints) be valuable?

### 12.2 Future Extensions

Potential areas for specification enhancement:

- **Bulk event delivery:** Single request with multiple events for efficiency
- **Event filtering:** Merchants configure which events platforms want to receive
- **Webhook subscriptions:** Dynamic webhook registration via API
- **Standard webhook headers:** Additional metadata for routing/debugging

Community feedback is welcome on these topics.

---

## 13. Change Log

- **2025-10-19**: Initial draft. Provides guidance on authentication options (HMAC, Ed25519, mTLS), retry patterns, operational considerations, and conformance requirements.
