# RFC: Agentic Commerce — 3DS Authentication Flow

**Status:** Draft
**Version:** 2025-12-16
**Scope:** 3D Secure authentication for card payments in agentic checkout

This RFC defines the **3DS Authentication Flow** for the Agentic Commerce Protocol (ACP), enabling secure card payments that require issuer authentication via 3D Secure 2.x.

---

## 1. Scope & Goals

- Enable merchants to request 3DS authentication when required by card issuers.
- Provide a standardized flow for agent platforms to present 3DS challenges to users.
- Support both **frictionless** (no user interaction) and **challenge** (user authentication required) flows.
- Maintain **PCI compliance** by keeping sensitive card data out of the challenge flow.

**Supported 3DS Versions:** 3DS 2.1.0, 3DS 2.2.0, 3DS 2.3.0

**Out of scope:** 3DS 1.0 (legacy protocol), biometric/FIDO authentication, recurring payment setup via 3DS.

### 1.1 Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **MAY** follow RFC 2119/8174.

---

## 2. Protocol Flow

### 2.1 Frictionless Flow (No Challenge Required)

When the issuer approves the transaction without user interaction:

```
Agent → Merchant: POST /checkout_sessions/{id}/complete
                  (payment_data with token)

Merchant → PSP: Initiate 3DS authentication
PSP → Issuer: Risk assessment
Issuer → PSP: Approved (frictionless, ECI=05/02)

Merchant → Agent: 200 OK
                  CheckoutSession (status=completed, order={...})
```

The agent receives a completed checkout session with an order. No additional steps are required.

### 2.2 Challenge Flow (User Authentication Required)

When the issuer requires user authentication:

```
1. Initial Payment Attempt
   Agent → Merchant: POST /checkout_sessions/{id}/complete
                     (payment_data with token)

   Merchant → PSP: Initiate 3DS authentication
   PSP → Issuer: Risk assessment
   Issuer → PSP: Challenge required

   Merchant → Agent: 200 OK
                     CheckoutSession (
                       status=in_progress,
                       messages=[{
                         type: "error",
                         code: "requires_3ds",
                         authentication_data: {...}
                       }]
                     )

2. Agent Platform Presents Challenge
   Agent Platform: Renders 3DS challenge to user
                   - Iframe with ACS URL
                   - User completes OTP/biometric/etc.
                   - Captures challenge response (cres)

3. Submit Authentication Result
   Agent → Merchant: POST /checkout_sessions/{id}/authenticate
                     (authentication_result with cres)

   Merchant → PSP: Complete 3DS with cres
   PSP → Issuer: Validate authentication

   Merchant → Agent: 200 OK
                     CheckoutSession (
                       status=ready_for_payment,
                       three_ds_result: { eci, cavv, ... }
                     )

4. Complete Payment with 3DS Proof
   Agent → Merchant: POST /checkout_sessions/{id}/complete
                     (payment_data with token + three_ds_proof)

   Merchant → PSP: Authorize payment with 3DS proof

   Merchant → Agent: 200 OK
                     CheckoutSession (status=completed, order={...})
```

**Key Design Decision:** The `/authenticate` endpoint validates the 3DS challenge and returns the authentication proof (ECI, CAVV, etc.), but does **not** create the order. The agent must call `/complete` again with the `three_ds_proof` to finalize the payment. This separation provides:

- **Semantic clarity**: `/complete` always creates the order, `/authenticate` only handles authentication
- **Retry flexibility**: If authorization fails after successful 3DS, the agent can retry `/complete` without re-authenticating
- **Alignment with PSP flows**: Mirrors how most payment processors separate authentication from authorization

---

## 3. Data Structures

### 3.1 ThreeDsAuthenticationData

Returned in the `requires_3ds` error message when a challenge is required:

| Field | Type | Req | Description |
|-------|------|:---:|-------------|
| `version` | string | ✅ | 3DS protocol version (`2.1.0`, `2.2.0`, `2.3.0`) |
| `acs_url` | string (uri) | ✅ | Access Control Server URL for challenge |
| `creq` | string | ✅ | Base64-encoded Challenge Request |
| `session_data` | string | ✅ | Opaque session identifier for continuation |
| `three_ds_server_trans_id` | string | ❌ | 3DS Server Transaction ID |

**Example:**

```json
{
  "version": "2.1.0",
  "acs_url": "https://acs.issuerbank.com/3ds2/challenge",
  "creq": "eyJhY3NUcmFuc0lEIjoiM2FjNzk0YjgtZGI1Zi00ZjczLWExYTYtNDU3ODkxMjM0NTY3Iiw...",
  "session_data": "cs_3ds_01HV3P3ABC123XYZ",
  "three_ds_server_trans_id": "8f916f8e-7e7a-4f73-a1a6-457891234567"
}
```

### 3.2 ThreeDsAuthenticationResult

Submitted by the agent to complete authentication:

| Field | Type | Req | Description |
|-------|------|:---:|-------------|
| `session_data` | string | ✅ | Opaque session identifier from `authentication_data` |
| `cres` | string | ✅ | Base64-encoded Challenge Response from ACS |

**Example:**

```json
{
  "session_data": "cs_3ds_01HV3P3ABC123XYZ",
  "cres": "eyJ0cmFuc1N0YXR1cyI6IlkiLCJhdXRoZW50aWNhdGlvblZhbHVlIjoiQWdBQUFBQUFBQUE9In0="
}
```

### 3.3 ThreeDsResult

Returned by `/authenticate` after successful 3DS authentication. Contains the cryptographic proof of authentication:

| Field | Type | Req | Description |
|-------|------|:---:|-------------|
| `eci` | string | ✅ | Electronic Commerce Indicator (e.g., `"05"`, `"02"`) |
| `cavv` | string | ✅ | Cardholder Authentication Verification Value (base64) |
| `ds_transaction_id` | string | ✅ | Directory Server Transaction ID |
| `acs_transaction_id` | string | ❌ | ACS Transaction ID |
| `version` | string | ✅ | 3DS protocol version used |
| `authentication_status` | string | ✅ | Authentication status (`Y`, `A`, `N`, `U`, `R`) |

**Example:**

```json
{
  "eci": "05",
  "cavv": "AAABBJkZUQAAAABjRWWZEEFgFz8=",
  "ds_transaction_id": "8f916f8e-7e7a-4f73-a1a6-457891234567",
  "acs_transaction_id": "3ac794b8-db5f-4f73-a1a6-457891234567",
  "version": "2.1.0",
  "authentication_status": "Y"
}
```

**Authentication Status Values:**
- `Y` - Authentication successful
- `A` - Attempted authentication (proof generated)
- `N` - Authentication failed
- `U` - Authentication unavailable
- `R` - Authentication rejected

### 3.4 ThreeDsProof

Submitted with `/complete` to authorize payment using 3DS authentication proof:

| Field | Type | Req | Description |
|-------|------|:---:|-------------|
| `eci` | string | ✅ | Electronic Commerce Indicator |
| `cavv` | string | ✅ | Cardholder Authentication Verification Value |
| `ds_transaction_id` | string | ✅ | Directory Server Transaction ID |
| `trans_status` | string | ❌ | Transaction status (`Y`, `A`, `N`, `U`, `R`, `C`) |
| `version` | string | ❌ | 3DS protocol version |

**Example:**

```json
{
  "eci": "05",
  "cavv": "AAABBJkZUQAAAABjRWWZEEFgFz8=",
  "ds_transaction_id": "8f916f8e-7e7a-4f73-a1a6-457891234567",
  "trans_status": "Y",
  "version": "2.1.0"
}
```

### 3.5 Extended MessageError

The existing `MessageError` type is extended with an optional `authentication_data` field:

| Field | Type | Req | Description |
|-------|------|:---:|-------------|
| `type` | string | ✅ | Always `"error"` |
| `code` | string | ✅ | Error code (e.g., `requires_3ds`) |
| `param` | string | ❌ | RFC 9535 JSONPath to related field |
| `content_type` | string | ✅ | `"plain"` or `"markdown"` |
| `content` | string | ✅ | Human-readable message |
| `authentication_data` | ThreeDsAuthenticationData | ❌ | Present when `code` is `requires_3ds` |

### 3.6 Extended CheckoutSession

The `CheckoutSession` response is extended with an optional `three_ds_result` field:

| Field | Type | Req | Description |
|-------|------|:---:|-------------|
| `three_ds_result` | ThreeDsResult | ❌ | Present after successful `/authenticate` call |

---

## 4. Endpoints

### 4.1 Complete Session (Existing, Updated Behavior)

`POST /checkout_sessions/{checkout_session_id}/complete`

The `/complete` endpoint now accepts an optional `three_ds_proof` field for payments authenticated via 3DS.

**Request Body (with 3DS proof):**

```json
{
  "buyer": { ... },
  "payment_data": {
    "token": "vt_01J8Z3WXYZ9ABC",
    "provider": "stripe"
  },
  "three_ds_proof": {
    "eci": "05",
    "cavv": "AAABBJkZUQAAAABjRWWZEEFgFz8=",
    "ds_transaction_id": "8f916f8e-7e7a-4f73-a1a6-457891234567",
    "trans_status": "Y",
    "version": "2.1.0"
  }
}
```

**Behavior:**

1. **Without `three_ds_proof`**: Merchant initiates 3DS. If challenge required, returns `status: in_progress` with `requires_3ds` error and `authentication_data`.

2. **With `three_ds_proof`**: Merchant authorizes payment using the provided 3DS proof. Returns `status: completed` with `order` on success.

The session remains in `in_progress` state until authentication completes or times out.

### 4.2 Authenticate Session (New Endpoint)

`POST /checkout_sessions/{checkout_session_id}/authenticate`

Submits the 3DS authentication result after the user completes the challenge.

**Request Headers:**

| Header | Required | Description |
|--------|:--------:|-------------|
| `Authorization` | ✅ | Bearer token |
| `Content-Type` | ✅ | `application/json` |
| `Idempotency-Key` | Recommended | Prevents duplicate processing |
| `Request-Id` | Recommended | Correlation identifier |
| `API-Version` | ✅ | `2025-12-16` |

**Request Body:**

```json
{
  "authentication_result": {
    "session_data": "cs_3ds_01HV3P3ABC123XYZ",
    "cres": "eyJ0cmFuc1N0YXR1cyI6IlkiLC..."
  }
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| `200 OK` | Authentication processed, returns updated `CheckoutSession` with `three_ds_result` |
| `400 Bad Request` | Invalid or malformed request |
| `404 Not Found` | Session not found or `session_data` invalid |
| `409 Conflict` | Idempotency conflict |
| `410 Gone` | 3DS session expired |

**Success Response (Authentication Succeeded):**

The response includes `three_ds_result` containing the authentication proof. The session status returns to `ready_for_payment`, and the agent must call `/complete` again with `three_ds_proof` to finalize the payment.

```json
{
  "id": "checkout_session_123",
  "status": "ready_for_payment",
  "three_ds_result": {
    "eci": "05",
    "cavv": "AAABBJkZUQAAAABjRWWZEEFgFz8=",
    "ds_transaction_id": "8f916f8e-7e7a-4f73-a1a6-457891234567",
    "acs_transaction_id": "3ac794b8-db5f-4f73-a1a6-457891234567",
    "version": "2.1.0",
    "authentication_status": "Y"
  },
  "messages": [],
  ...
}
```

**Failure Response (Authentication Failed):**

```json
{
  "id": "checkout_session_123",
  "status": "ready_for_payment",
  "messages": [
    {
      "type": "error",
      "code": "payment_declined",
      "content_type": "plain",
      "content": "3D Secure authentication failed. Please try again or use a different payment method."
    }
  ],
  ...
}
```

---

## 5. Session State Transitions

```
                    ┌─────────────────────┐
                    │  ready_for_payment  │
                    └──────────┬──────────┘
                               │
                    POST /complete (without 3DS proof)
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌─────────────┐   ┌─────────────┐   ┌───────────┐
     │  completed  │   │ in_progress │   │  declined │
     │(frictionless)│  │ (challenge) │   │           │
     └─────────────┘   └──────┬──────┘   └───────────┘
                              │
                   POST /authenticate
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
  ┌───────────────────┐  ┌───────────────┐  ┌─────────┐
  │ ready_for_payment │  │ready_for_payment│ │ timeout │
  │ + three_ds_result │  │   (failure)    │  │(expired)│
  └─────────┬─────────┘  └───────────────┘  └─────────┘
            │
    POST /complete (with three_ds_proof)
            │
            ▼
     ┌─────────────┐
     │  completed  │
     │  + order    │
     └─────────────┘
```

---

## 6. Implementation Guidance

### 6.1 For Merchants

#### 6.1.1 Initiating 3DS

When processing `/complete`, merchants **MUST**:

1. Forward payment token and amount to their PSP's 3DS initiation endpoint
2. Include browser/device data from request headers (`User-Agent`)
3. Handle PSP's 3DS response:
   - If `frictionless`: Complete authorization immediately
   - If `challenge_required`: Return `requires_3ds` with challenge data
   - If `error`: Return `payment_declined`

#### 6.1.2 Session State Management

Merchants **MUST** maintain 3DS session state:

```
Key: session_data (e.g., "cs_3ds_01HV3P3ABC123XYZ")
Value: {
  checkout_session_id,
  three_ds_server_trans_id,
  payment_data,
  buyer,
  created_at,
  expires_at  // 10 minutes from creation
}
TTL: 10 minutes
```

#### 6.1.3 Processing Authentication Results

When processing `/authenticate`, merchants **MUST**:

1. Validate `session_data` exists and is not expired
2. Forward `cres` to PSP for 3DS completion
3. If authentication successful: Complete payment authorization
4. Clean up session state after processing

#### 6.1.4 Timeout Handling

Merchants **SHOULD** implement a 10-minute timeout for 3DS sessions:

- After timeout, return `410 Gone` for `/authenticate` requests
- Clean up expired session state
- Session returns to `ready_for_payment` on next retrieval

### 6.2 For Agent Platforms

#### 6.2.1 Detecting 3DS Requirement

After calling `/complete`, check for `requires_3ds` in messages:

```javascript
const response = await completeCheckout(sessionId, paymentData);

const threeDsMessage = response.messages.find(
  m => m.type === 'error' && m.code === 'requires_3ds'
);

if (threeDsMessage) {
  const { authentication_data } = threeDsMessage;
  // Present challenge to user
}
```

#### 6.2.2 Presenting the Challenge

Agent platforms **MUST** present 3DS challenges using an iframe. This keeps the user within the checkout context and provides the best user experience.

```html
<iframe
  id="3ds-challenge"
  name="3ds-challenge"
  sandbox="allow-forms allow-scripts allow-same-origin"
  style="width: 400px; height: 600px; border: none;">
</iframe>

<form id="3ds-form" method="POST" action="{acs_url}" target="3ds-challenge">
  <input type="hidden" name="creq" value="{creq}">
  <input type="hidden" name="threeDSSessionData" value="{session_data}">
</form>

<script>
  document.getElementById('3ds-form').submit();
</script>
```

#### 6.2.3 Capturing the Response

After the user completes the challenge, the ACS posts the `cres` (Challenge Response) back to the iframe. Agent platforms **MUST**:

1. Listen for the `cres` from the ACS response (typically via `postMessage` or form POST to a notification URL)
2. Extract the base64-encoded `cres` value
3. Submit to merchant via `POST /authenticate`
4. On success, call `POST /complete` with the `three_ds_proof` from the response
5. Handle errors appropriately (show message, allow retry with different payment method)

```javascript
// Example: Listening for 3DS completion
window.addEventListener('message', async (event) => {
  if (event.data.type === '3ds-complete') {
    const { cres } = event.data;

    // Submit authentication result
    const authResponse = await authenticateCheckout(sessionId, {
      authentication_result: { session_data, cres }
    });

    if (authResponse.three_ds_result) {
      // Complete payment with 3DS proof
      const completeResponse = await completeCheckout(sessionId, {
        payment_data,
        three_ds_proof: {
          eci: authResponse.three_ds_result.eci,
          cavv: authResponse.three_ds_result.cavv,
          ds_transaction_id: authResponse.three_ds_result.ds_transaction_id,
          trans_status: authResponse.three_ds_result.authentication_status,
          version: authResponse.three_ds_result.version
        }
      });
      // Order created successfully
    }
  }
});
```

---

## 7. Security Considerations

### 7.1 PCI Compliance

- Card data **MUST NOT** appear in the 3DS challenge flow
- `creq` and `cres` are opaque base64-encoded strings containing no PAN
- Merchants **MUST NOT** log full `creq` or `cres` payloads
- All communication **MUST** use HTTPS/TLS 1.2+

### 7.2 Session Security

- `session_data` **MUST** be an opaque, unpredictable identifier
- Merchants **MUST** expire 3DS sessions after 10 minutes
- `session_data` **MUST** be single-use (invalidated after `/authenticate`)

### 7.3 Iframe Security

Agent platforms presenting 3DS challenges **SHOULD**:

- Use `sandbox` attribute on iframes
- Only allow necessary permissions: `allow-forms allow-scripts allow-same-origin`
- Validate ACS URL domain before rendering

### 7.4 Rate Limiting

- Merchants **SHOULD** rate limit `/authenticate` (e.g., 10 requests/minute per session)

---

## 8. Error Handling

### 8.1 Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `requires_3ds` | 200 | 3DS challenge required (with `authentication_data`) |
| `payment_declined` | 200 | Authentication failed or payment declined |
| `invalid` | 400 | Malformed request or invalid `cres` |
| `session_expired` | 410 | 3DS session has expired |
| `idempotency_conflict` | 409 | Same key with different parameters |

### 8.2 Retry Behavior

| Scenario | Retry? | Action |
|----------|--------|--------|
| `requires_3ds` returned | No | Present challenge to user |
| `payment_declined` after auth | Yes | Retry with different payment method |
| `session_expired` | Yes | Restart checkout flow |
| Network timeout on `/authenticate` | Yes | Retry with same `Idempotency-Key` |

---

## 9. Examples

### 9.1 Complete Session — 3DS Challenge Required

**Request:**

```http
POST /checkout_sessions/cs_123/complete HTTP/1.1
Host: merchant.example.com
Authorization: Bearer api_key_123
Content-Type: application/json
Idempotency-Key: idem_complete_abc123
API-Version: 2025-12-16

{
  "buyer": {
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com"
  },
  "payment_data": {
    "token": "vt_01J8Z3WXYZ9ABC",
    "provider": "stripe"
  }
}
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Idempotency-Key: idem_complete_abc123

{
  "id": "cs_123",
  "status": "in_progress",
  "currency": "usd",
  "line_items": [...],
  "totals": [...],
  "messages": [
    {
      "type": "error",
      "code": "requires_3ds",
      "content_type": "plain",
      "content": "Payment requires 3D Secure authentication. Please complete the authentication challenge.",
      "authentication_data": {
        "version": "2.1.0",
        "acs_url": "https://acs.issuerbank.com/3ds2/challenge",
        "creq": "eyJhY3NUcmFuc0lEIjoiM2FjNzk0YjgtZGI1Zi00...",
        "session_data": "cs_3ds_01HV3P3ABC123XYZ",
        "three_ds_server_trans_id": "8f916f8e-7e7a-4f73-a1a6-457891234567"
      }
    }
  ],
  "links": [...]
}
```

### 9.2 Authenticate Session — Success

**Request:**

```http
POST /checkout_sessions/cs_123/authenticate HTTP/1.1
Host: merchant.example.com
Authorization: Bearer api_key_123
Content-Type: application/json
Idempotency-Key: idem_auth_def456
API-Version: 2025-12-16

{
  "authentication_result": {
    "session_data": "cs_3ds_01HV3P3ABC123XYZ",
    "cres": "eyJ0cmFuc1N0YXR1cyI6IlkiLCJhdXRoZW50aWNhdGlvblZhbHVlIjoiQWdBQUFBQT0ifQ=="
  }
}
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "cs_123",
  "status": "ready_for_payment",
  "currency": "usd",
  "line_items": [...],
  "totals": [...],
  "three_ds_result": {
    "eci": "05",
    "cavv": "AAABBJkZUQAAAABjRWWZEEFgFz8=",
    "ds_transaction_id": "8f916f8e-7e7a-4f73-a1a6-457891234567",
    "acs_transaction_id": "3ac794b8-db5f-4f73-a1a6-457891234567",
    "version": "2.1.0",
    "authentication_status": "Y"
  },
  "messages": [],
  "links": [...]
}
```

### 9.3 Complete Session with 3DS Proof — Success

**Request:**

```http
POST /checkout_sessions/cs_123/complete HTTP/1.1
Host: merchant.example.com
Authorization: Bearer api_key_123
Content-Type: application/json
Idempotency-Key: idem_complete_xyz789
API-Version: 2025-12-16

{
  "buyer": {
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com"
  },
  "payment_data": {
    "token": "vt_01J8Z3WXYZ9ABC",
    "provider": "stripe"
  },
  "three_ds_proof": {
    "eci": "05",
    "cavv": "AAABBJkZUQAAAABjRWWZEEFgFz8=",
    "ds_transaction_id": "8f916f8e-7e7a-4f73-a1a6-457891234567",
    "trans_status": "Y",
    "version": "2.1.0"
  }
}
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "cs_123",
  "status": "completed",
  "currency": "usd",
  "line_items": [...],
  "totals": [...],
  "messages": [],
  "order": {
    "id": "ord_abc123",
    "checkout_session_id": "cs_123",
    "permalink_url": "https://merchant.example.com/orders/ord_abc123"
  },
  "links": [...]
}
```

### 9.4 Authenticate Session — Failure

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "cs_123",
  "status": "ready_for_payment",
  "messages": [
    {
      "type": "error",
      "code": "payment_declined",
      "content_type": "plain",
      "content": "3D Secure authentication failed. Please try again or use a different payment method."
    }
  ],
  ...
}
```

### 9.5 Authenticate Session — Expired

**Response:**

```http
HTTP/1.1 410 Gone
Content-Type: application/json

{
  "type": "invalid_request",
  "code": "session_expired",
  "message": "3DS authentication session has expired. Please restart the checkout flow."
}
```

---

## 10. Conformance Checklist

### 10.1 Merchant Implementation

- [ ] Returns `requires_3ds` error with valid `authentication_data` when challenge required
- [ ] `authentication_data` includes all required fields (version, acs_url, creq, session_data)
- [ ] Implements `POST /authenticate` endpoint with idempotency support
- [ ] Session status transitions: `ready_for_payment` → `in_progress` → `completed`
- [ ] Validates `cres` format before forwarding to PSP
- [ ] Enforces 10-minute timeout on 3DS sessions
- [ ] Cleans up expired 3DS session state
- [ ] Does not log PCI-sensitive data (creq, cres, card numbers)
- [ ] Returns appropriate errors for expired/invalid sessions

### 10.2 Agent Platform Implementation

- [ ] Detects `requires_3ds` in messages array
- [ ] Extracts `authentication_data` from error message
- [ ] Presents 3DS challenge in secure iframe
- [ ] Captures `cres` from ACS response (via postMessage or notification URL)
- [ ] Submits authentication result to merchant via `/authenticate`
- [ ] Calls `/complete` with `three_ds_proof` after successful authentication
- [ ] Handles timeout gracefully (10-minute session limit)
- [ ] Shows clear user messaging during authentication

---

## 11. Change Log

- **2025-12-16**: Initial draft. Defines 3DS 2.x authentication flow for ACP.
