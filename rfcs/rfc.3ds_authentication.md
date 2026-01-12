# RFC: Agentic Commerce — 3DS Authentication Flow

**Status:** Draft
**Version:** 2025-12-25
**Scope:** 3D Secure authentication for card payments in agentic checkout

This RFC defines the **3DS Authentication Flow** for the Agentic Commerce Protocol (ACP), enabling secure card payments that require issuer authentication via 3D Secure 2.x.

---

## 1. Scope & Goals

- Enable merchants to request 3DS authentication when required by card issuers.
- Provide a standardized flow for agent platforms to present 3DS challenges to users.
- Support both **frictionless** (no user interaction) and **challenge** (user authentication required) flows.
- Maintain **PCI compliance** by keeping sensitive card data out of the challenge flow.
- Keep the agent **as agnostic as possible** to 3DS implementation details - merchant handles all PSP interactions.

**Supported 3DS Versions:** 3DS 2.1.0, 3DS 2.2.0, 3DS 2.3.0

**Out of scope:** 3DS 1.0 (legacy protocol), biometric/FIDO authentication, recurring payment setup via 3DS.

### 1.1 Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **MAY** follow RFC 2119/8174.

---

## 2. Protocol Flow

All 3DS interactions are consolidated into the `/complete` endpoint. The agent simply keeps calling `/complete` with whatever data the merchant requests until the order is created.

### 2.1 Frictionless Flow (No Challenge Required)

When the issuer approves the transaction without user interaction:

```
Agent → Merchant: POST /checkout_sessions/{id}/complete
                  (payment_data with token)

Merchant → PSP: Initiate 3DS authentication
PSP → Issuer: Risk assessment
Issuer → PSP: Approved (frictionless, ECI=05/02)

Merchant → Agent: 200 OK
                  CheckoutSession (status=completed, order={...}, three_ds_result={...})
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
                       pending_action={
                         type: "3ds_challenge",
                         acs_url: "...",
                         creq: "...",
                         session_data: "..."
                       }
                     )

2. Agent Platform Presents Challenge
   Agent Platform: Renders 3DS challenge to user
                   - Iframe with ACS URL
                   - User completes OTP/biometric/etc.
                   - Captures challenge response (cres)

3. Submit Challenge Response
   Agent → Merchant: POST /checkout_sessions/{id}/complete
                     (session_data + cres)

   Merchant → PSP: Complete 3DS with cres
   PSP → Issuer: Validate authentication
   Merchant → PSP: Authorize payment

   Merchant → Agent: 200 OK
                     CheckoutSession (
                       status=completed,
                       order={...},
                       three_ds_result={eci, cavv, ...}
                     )
```

**Key Design Decision:** All 3DS steps go through `/complete`. The agent doesn't need to know about separate authentication and authorization steps - the merchant handles this internally. This keeps the agent agnostic to 3DS implementation details.

### 2.3 3DS Method Flow (Device Fingerprinting)

The **3DS Method** is an optional pre-authentication step that allows the ACS to gather browser/device fingerprint data for risk-based decisioning. It executes **before** the Authentication Request (AReq) and can improve frictionless approval rates.

**Key characteristics:**
- Optional per card range (not all issuers provide a 3DS Method URL)
- Must complete within **10 seconds**
- Uses `threeDSServerTransID` to correlate fingerprint data with the later authentication
- Runs in a hidden iframe (invisible to the user)

```
1. Initial Payment Attempt
   Agent → Merchant: POST /checkout_sessions/{id}/complete
                     (payment_data with token)

   Merchant: Looks up card BIN, finds 3DS Method URL exists

   Merchant → Agent: 200 OK
                     CheckoutSession (
                       status=in_progress,
                       pending_action={
                         type: "3ds_method",
                         three_ds_method_url: "...",
                         three_ds_server_trans_id: "...",
                         session_data: "..."
                       }
                     )

2. Agent Renders 3DS Method (Hidden Iframe)
   Agent Platform: Creates hidden iframe
                   - POSTs threeDSMethodData to three_ds_method_url
                   - threeDSMethodData = base64({
                       threeDSServerTransID,
                       threeDSMethodNotificationURL
                     })
                   - Waits for ACS notification (max 10 seconds)

3. ACS Gathers Fingerprint
   Browser → ACS: Device fingerprint data collected
   ACS → Agent Platform: POST to threeDSMethodNotificationURL
                         (threeDSServerTransID confirmation)

4. Signal Fingerprint Completion
   Agent → Merchant: POST /checkout_sessions/{id}/complete
                     (session_data, method_completion_indicator)

   Merchant → PSP: Initiate AReq with threeDSMethodCompletionIndicator

5. Continue Based on AReq Result
   - If frictionless: Returns status=completed + order + three_ds_result
   - If challenge: Returns status=in_progress + pending_action={type: "3ds_challenge"}
   - If declined: Returns status=ready_for_payment + payment_declined error
```

**Note:** If the 3DS Method times out (no ACS callback within 10 seconds), the agent should call `/complete` with `method_completion_indicator: "timeout"`. The merchant will proceed with AReq using `threeDSMethodCompletionIndicator=U` (unavailable).

---

## 3. Data Structures

### 3.1 PendingAction3dsChallenge

Returned in `pending_action` when a 3DS challenge is required:

| Field | Type | Req | Description |
|-------|------|:---:|-------------|
| `type` | string | ✅ | Always `"3ds_challenge"` |
| `data` | object | ✅ | Challenge data (see below) |

**`data` object fields:**

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
  "type": "3ds_challenge",
  "data": {
    "version": "2.1.0",
    "acs_url": "https://acs.issuerbank.com/3ds2/challenge",
    "creq": "eyJhY3NUcmFuc0lEIjoiM2FjNzk0YjgtZGI1Zi00ZjczLWExYTYtNDU3ODkxMjM0NTY3Iiw...",
    "session_data": "cs_3ds_01HV3P3ABC123XYZ",
    "three_ds_server_trans_id": "8f916f8e-7e7a-4f73-a1a6-457891234567"
  }
}
```

### 3.2 PendingAction3dsMethod

Returned in `pending_action` when device fingerprinting is required:

| Field | Type | Req | Description |
|-------|------|:---:|-------------|
| `type` | string | ✅ | Always `"3ds_method"` |
| `data` | object | ✅ | Method data (see below) |

**`data` object fields:**

| Field | Type | Req | Description |
|-------|------|:---:|-------------|
| `three_ds_method_url` | string (uri) | ✅ | ACS URL for device fingerprinting |
| `three_ds_server_trans_id` | string | ✅ | 3DS Server Transaction ID (UUID format) |
| `session_data` | string | ✅ | Opaque session identifier for continuation |
| `version` | string | ✅ | 3DS protocol version (`2.1.0`, `2.2.0`, `2.3.0`) |
| `ds_identifier` | string | ✅ | Directory Server Identifier |

**Example:**

```json
{
  "type": "3ds_method",
  "data": {
    "three_ds_method_url": "https://acs.issuerbank.com/3ds2/method",
    "three_ds_server_trans_id": "8f916f8e-7e7a-4f73-a1a6-457891234567",
    "session_data": "cs_3ds_01HV3P3ABC123XYZ",
    "version": "2.1.0",
    "ds_identifier": "A000000003"
  }
}
```

### 3.3 ThreeDsResult

Returned in the response after successful 3DS authentication. Contains the cryptographic proof of authentication for transparency/auditing:

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

### 3.4 Extended CheckoutSession

The `CheckoutSession` response is extended with optional 3DS-related fields:

| Field | Type | Req | Description |
|-------|------|:---:|-------------|
| `pending_action` | PendingAction | ❌ | Present when agent action is required (3DS Method or Challenge) |
| `three_ds_result` | ThreeDsResult | ❌ | Present after successful 3DS authentication (with completed status) |

The `pending_action` field uses a discriminated union based on `type`:
- `type: "3ds_method"` → `PendingAction3dsMethod` (Section 3.2)
- `type: "3ds_challenge"` → `PendingAction3dsChallenge` (Section 3.1)

---

## 4. Endpoints

### 4.1 Complete Session (Updated Behavior)

`POST /checkout_sessions/{checkout_session_id}/complete`

The `/complete` endpoint handles all checkout completion scenarios including 3DS authentication steps.

**Request Headers:**

| Header | Required | Description |
|--------|:--------:|-------------|
| `Authorization` | ✅ | Bearer token |
| `Content-Type` | ✅ | `application/json` |
| `Idempotency-Key` | Recommended | Prevents duplicate processing |
| `Request-Id` | Recommended | Correlation identifier |
| `API-Version` | ✅ | `2025-12-25` |

**Request Body Variants:**

The request body varies depending on the current step in the checkout flow:

**1. Initial payment attempt:**

```json
{
  "buyer": { ... },
  "payment_data": {
    "token": "vt_01J8Z3WXYZ9ABC",
    "provider": "stripe"
  }
}
```

**2. After 3DS Method completion:**

```json
{
  "session_data": "cs_3ds_01HV3P3ABC123XYZ",
  "method_completion_indicator": "completed"
}
```

**3. After 3DS Challenge completion:**

```json
{
  "session_data": "cs_3ds_01HV3P3ABC123XYZ",
  "cres": "eyJ0cmFuc1N0YXR1cyI6IlkiLC..."
}
```

**Request Body Schema:**

| Field | Type | Description |
|-------|------|-------------|
| `buyer` | Buyer | Buyer information (optional on subsequent calls) |
| `payment_data` | PaymentData | Payment token and provider (initial call only) |
| `session_data` | string | Opaque session identifier from `pending_action` (required for 3DS steps) |
| `method_completion_indicator` | string | `completed` or `timeout` (after 3DS Method) |
| `cres` | string | Base64-encoded Challenge Response from ACS (after challenge) |

**Note:** Only one of `payment_data`, `method_completion_indicator`, or `cres` should be provided per request.

**Response Scenarios:**

| Scenario | Status | Response |
|----------|--------|----------|
| 3DS Method required | `in_progress` | `pending_action: {type: "3ds_method", ...}` |
| Challenge required | `in_progress` | `pending_action: {type: "3ds_challenge", ...}` |
| Frictionless success | `completed` | `order: {...}, three_ds_result: {...}` |
| Challenge success | `completed` | `order: {...}, three_ds_result: {...}` |
| Authentication failed | `ready_for_payment` | `messages: [{code: "payment_declined", ...}]` |
| Session expired | `410 Gone` | Error response |

---

## 5. Session State Transitions

```
                    ┌─────────────────────┐
                    │  ready_for_payment  │
                    └──────────┬──────────┘
                               │
                    POST /complete (payment_data)
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
  ┌─────────────┐      ┌─────────────────┐   ┌─────────────────┐
  │  completed  │      │   in_progress   │   │   in_progress   │
  │(frictionless)│     │ pending_action: │   │ pending_action: │
  │+three_ds_result│   │  {type:3ds_method}│  │  {type:3ds_challenge}│
  └─────────────┘      └────────┬────────┘   └────────┬────────┘
                               │                      │
                    POST /complete              POST /complete
                  (method_completion_indicator)      (cres)
                               │                      │
         ┌─────────────────────┤                      │
         │                     │                      │
         ▼                     ▼                      │
  ┌─────────────┐      ┌─────────────────┐           │
  │  completed  │      │   in_progress   │           │
  │(frictionless)│     │ pending_action: │           │
  │+three_ds_result│   │  {type:3ds_challenge}│       │
  └─────────────┘      └────────┬────────┘           │
                               │                      │
                    POST /complete (cres)            │
                               │                      │
                               ├──────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                                 │
              ▼                                 ▼
    ┌───────────────────┐             ┌─────────────┐
    │ ready_for_payment │             │  completed  │
    │ (payment_declined)│             │  + order    │
    └───────────────────┘             │+three_ds_result│
                                      └─────────────┘
```

**Note:** The 3DS Method step (`pending_action.type: "3ds_method"`) is optional - it only occurs when the card range has a 3DS Method URL configured. Without it, the flow proceeds directly to either frictionless completion or challenge.

---

## 6. Implementation Guidance

### 6.1 For Merchants

#### 6.1.1 Checking for 3DS Method

When processing `/complete` with `payment_data`, before initiating 3DS authentication, merchants **SHOULD**:

1. Look up the card BIN in their stored PRes card range data
2. If a `three_ds_method_url` exists for this card range:
   - Return `pending_action` with `type: "3ds_method"` and fingerprinting data
   - Store session state for later continuation
3. If no 3DS Method URL exists, proceed directly to 3DS authentication (Section 6.1.2)

#### 6.1.2 Initiating 3DS

When processing `/complete` with `payment_data` (no 3DS Method) or `method_completion_indicator` (after 3DS Method), merchants **MUST**:

1. Forward payment token and amount to their PSP's 3DS initiation endpoint
2. Include browser/device data from request headers (`User-Agent`)
3. If processing after 3DS Method, include `threeDSMethodCompletionIndicator` based on `method_completion_indicator`
4. Handle PSP's 3DS response:
   - If `frictionless`: Complete authorization immediately, return `status: completed` with `order` and `three_ds_result`
   - If `challenge_required`: Return `pending_action` with `type: "3ds_challenge"` and challenge data
   - If `error`: Return `payment_declined` in messages

#### 6.1.3 Processing Challenge Response

When processing `/complete` with `cres`, merchants **MUST**:

1. Validate `session_data` exists and is not expired
2. Forward `cres` to PSP for 3DS completion
3. If authentication successful: Complete payment authorization
4. Return `status: completed` with `order` and `three_ds_result`
5. Clean up session state after processing

#### 6.1.4 Session State Management

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

#### 6.1.5 Timeout Handling

Merchants **SHOULD** implement a 10-minute timeout for 3DS sessions:

- After timeout, return `410 Gone` for `/complete` requests with stale `session_data`
- Clean up expired session state
- Session returns to `ready_for_payment` on next retrieval

### 6.2 For Agent Platforms

#### 6.2.1 Detecting 3DS Requirement

After calling `/complete`, check the `pending_action` field:

```javascript
const response = await completeCheckout(sessionId, { payment_data, buyer });

// Check for 3DS Method (device fingerprinting) requirement
if (response.pending_action?.type === '3ds_method') {
  const { three_ds_method_url, session_data, three_ds_server_trans_id } = response.pending_action.data;
  // Execute 3DS Method in hidden iframe (Section 6.2.2)
}

// Check for 3DS Challenge requirement
if (response.pending_action?.type === '3ds_challenge') {
  const { acs_url, creq, session_data, version } = response.pending_action.data;
  // Present challenge to user (Section 6.2.3)
}

// Check for completion
if (response.status === 'completed') {
  // Order created, show confirmation
}
```

#### 6.2.2 Executing 3DS Method (Device Fingerprinting)

When `pending_action.type === '3ds_method'` is returned, agent platforms **MUST**:

1. Create a hidden iframe
2. POST `threeDSMethodData` (base64 JSON) to the `three_ds_method_url`
3. Wait up to 10 seconds for ACS notification
4. Call `/complete` with `session_data` and `method_completion_indicator`

```html
<!-- Hidden iframe for 3DS Method -->
<iframe
  id="3ds-method"
  name="3ds-method"
  style="display: none; width: 0; height: 0;">
</iframe>

<form id="3ds-method-form" method="POST" action="{three_ds_method_url}" target="3ds-method">
  <input type="hidden" name="threeDSMethodData" value="{base64_encoded_data}">
</form>
```

**threeDSMethodData format** (before base64 encoding):

```json
{
  "threeDSServerTransID": "8f916f8e-7e7a-4f73-a1a6-457891234567",
  "threeDSMethodNotificationURL": "https://agent-platform.example.com/3ds-method-callback"
}
```

**Timeout handling:**

```javascript
// Start 3DS Method
document.getElementById('3ds-method-form').submit();

// Set 10-second timeout
const timeout = setTimeout(async () => {
  await completeCheckout(sessionId, {
    session_data,
    method_completion_indicator: 'timeout'
  });
}, 10000);

// Listen for ACS notification (via your notification URL callback)
// When received, clear timeout and call /complete with 'completed'
```

#### 6.2.3 Presenting the Challenge

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

#### 6.2.4 Capturing the Response

After the user completes the challenge, the ACS posts the `cres` (Challenge Response) back to the iframe. Agent platforms **MUST**:

1. Listen for the `cres` from the ACS response (typically via `postMessage` or form POST to a notification URL)
2. Extract the base64-encoded `cres` value
3. Submit to merchant via `POST /complete` with `session_data` and `cres`
4. Handle the response (completed with order, or error)

```javascript
// Example: Listening for 3DS completion
window.addEventListener('message', async (event) => {
  if (event.data.type === '3ds-complete') {
    const { cres } = event.data;

    // Submit challenge response
    const response = await completeCheckout(sessionId, {
      session_data,
      cres
    });

    if (response.status === 'completed') {
      // Order created successfully
      console.log('Order:', response.order);
      console.log('3DS Result:', response.three_ds_result);
    } else if (response.messages?.some(m => m.code === 'payment_declined')) {
      // Authentication failed, allow retry with different payment method
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
- `session_data` **MUST** be single-use (invalidated after successful `/complete` with `cres`)

### 7.3 Iframe Security

Agent platforms presenting 3DS challenges **SHOULD**:

- Use `sandbox` attribute on iframes
- Only allow necessary permissions: `allow-forms allow-scripts allow-same-origin`
- Validate ACS URL domain before rendering

### 7.4 Rate Limiting

- Merchants **SHOULD** rate limit `/complete` with 3DS data (e.g., 10 requests/minute per session)

---

## 8. Error Handling

### 8.1 Pending Actions (Not Errors)

3DS steps are communicated via `pending_action` on the CheckoutSession, not error codes:

| Pending Action Type | Description |
|---------------------|-------------|
| `3ds_method` | 3DS Method (fingerprinting) required |
| `3ds_challenge` | 3DS challenge required |

### 8.2 Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `payment_declined` | 200 | Authentication failed or payment declined |
| `invalid` | 400 | Malformed request or invalid `cres` |
| `session_expired` | 410 | 3DS session has expired |
| `idempotency_conflict` | 409 | Same key with different parameters |

### 8.3 Retry Behavior

| Scenario | Retry? | Action |
|----------|--------|--------|
| `pending_action.type: "3ds_method"` | No | Execute 3DS Method, then call `/complete` |
| `pending_action.type: "3ds_challenge"` | No | Present challenge to user, then call `/complete` |
| `payment_declined` after challenge | Yes | Retry with different payment method |
| `session_expired` | Yes | Restart checkout flow |
| Network timeout on `/complete` | Yes | Retry with same `Idempotency-Key` |

---

## 9. Examples

### 9.1 Complete Session — 3DS Method Required

**Request:**

```http
POST /checkout_sessions/cs_123/complete HTTP/1.1
Host: merchant.example.com
Authorization: Bearer api_key_123
Content-Type: application/json
Idempotency-Key: idem_complete_abc123
API-Version: 2025-12-25

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

{
  "id": "cs_123",
  "status": "in_progress",
  "currency": "usd",
  "line_items": [...],
  "totals": [...],
  "pending_action": {
    "type": "3ds_method",
    "data": {
      "three_ds_method_url": "https://acs.issuerbank.com/3ds2/method",
      "three_ds_server_trans_id": "8f916f8e-7e7a-4f73-a1a6-457891234567",
      "session_data": "cs_3ds_01HV3P3ABC123XYZ",
      "version": "2.1.0",
      "ds_identifier": "A000000003"
    }
  },
  "messages": [],
  "links": [...]
}
```

### 9.2 Complete Session — After 3DS Method (Challenge Required)

**Request:**

```http
POST /checkout_sessions/cs_123/complete HTTP/1.1
Host: merchant.example.com
Authorization: Bearer api_key_123
Content-Type: application/json
Idempotency-Key: idem_complete_def456
API-Version: 2025-12-25

{
  "session_data": "cs_3ds_01HV3P3ABC123XYZ",
  "method_completion_indicator": "completed"
}
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "cs_123",
  "status": "in_progress",
  "currency": "usd",
  "line_items": [...],
  "totals": [...],
  "pending_action": {
    "type": "3ds_challenge",
    "data": {
      "version": "2.1.0",
      "acs_url": "https://acs.issuerbank.com/3ds2/challenge",
      "creq": "eyJhY3NUcmFuc0lEIjoiM2FjNzk0YjgtZGI1Zi00...",
      "session_data": "cs_3ds_01HV3P3ABC123XYZ",
      "three_ds_server_trans_id": "8f916f8e-7e7a-4f73-a1a6-457891234567"
    }
  },
  "messages": [],
  "links": [...]
}
```

### 9.3 Complete Session — 3DS Challenge Required (Direct)

**Request:**

```http
POST /checkout_sessions/cs_123/complete HTTP/1.1
Host: merchant.example.com
Authorization: Bearer api_key_123
Content-Type: application/json
Idempotency-Key: idem_complete_abc123
API-Version: 2025-12-25

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
  "pending_action": {
    "type": "3ds_challenge",
    "data": {
      "version": "2.1.0",
      "acs_url": "https://acs.issuerbank.com/3ds2/challenge",
      "creq": "eyJhY3NUcmFuc0lEIjoiM2FjNzk0YjgtZGI1Zi00...",
      "session_data": "cs_3ds_01HV3P3ABC123XYZ",
      "three_ds_server_trans_id": "8f916f8e-7e7a-4f73-a1a6-457891234567"
    }
  },
  "messages": [],
  "links": [...]
}
```

### 9.4 Complete Session — After Challenge (Success)

**Request:**

```http
POST /checkout_sessions/cs_123/complete HTTP/1.1
Host: merchant.example.com
Authorization: Bearer api_key_123
Content-Type: application/json
Idempotency-Key: idem_complete_xyz789
API-Version: 2025-12-25

{
  "session_data": "cs_3ds_01HV3P3ABC123XYZ",
  "cres": "eyJ0cmFuc1N0YXR1cyI6IlkiLCJhdXRoZW50aWNhdGlvblZhbHVlIjoiQWdBQUFBQT0ifQ=="
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
  "three_ds_result": {
    "eci": "05",
    "cavv": "AAABBJkZUQAAAABjRWWZEEFgFz8=",
    "ds_transaction_id": "8f916f8e-7e7a-4f73-a1a6-457891234567",
    "acs_transaction_id": "3ac794b8-db5f-4f73-a1a6-457891234567",
    "version": "2.1.0",
    "authentication_status": "Y"
  },
  "messages": [],
  "order": {
    "id": "ord_abc123",
    "checkout_session_id": "cs_123",
    "permalink_url": "https://merchant.example.com/orders/ord_abc123"
  },
  "links": [...]
}
```

### 9.5 Complete Session — After Challenge (Failure)

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

### 9.6 Complete Session — Session Expired

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

**3DS Method (Optional):**
- [ ] Looks up 3DS Method URL from stored PRes card range data
- [ ] Returns `pending_action` with `type: "3ds_method"` when 3DS Method is available
- [ ] `pending_action` includes all required fields (three_ds_method_url, three_ds_server_trans_id, session_data)
- [ ] Handles `/complete` with `method_completion_indicator` field
- [ ] Passes `threeDSMethodCompletionIndicator` to PSP based on `method_completion_indicator`

**3DS Challenge:**
- [ ] Returns `pending_action` with `type: "3ds_challenge"` when challenge required
- [ ] `pending_action` includes all required fields (version, acs_url, creq, session_data)
- [ ] Handles `/complete` with `cres` field
- [ ] Session status transitions: `ready_for_payment` → `in_progress` → `completed`
- [ ] Validates `cres` format before forwarding to PSP
- [ ] Returns `three_ds_result` in completed response
- [ ] Enforces 10-minute timeout on 3DS sessions
- [ ] Cleans up expired 3DS session state
- [ ] Does not log PCI-sensitive data (creq, cres, card numbers)
- [ ] Returns appropriate errors for expired/invalid sessions

### 10.2 Agent Platform Implementation

**3DS Method (Optional):**
- [ ] Detects `pending_action.type === "3ds_method"` in response
- [ ] Extracts fingerprinting data from `pending_action`
- [ ] Renders hidden iframe with `threeDSMethodData` to `three_ds_method_url`
- [ ] Hosts notification URL for ACS callback
- [ ] Implements 10-second timeout for 3DS Method
- [ ] Calls `/complete` with `session_data` and `method_completion_indicator`

**3DS Challenge:**
- [ ] Detects `pending_action.type === "3ds_challenge"` in response
- [ ] Extracts challenge data from `pending_action`
- [ ] Presents 3DS challenge in secure iframe
- [ ] Captures `cres` from ACS response (via postMessage or notification URL)
- [ ] Calls `/complete` with `session_data` and `cres`
- [ ] Handles `three_ds_result` in completed response
- [ ] Handles timeout gracefully (10-minute session limit)
- [ ] Shows clear user messaging during authentication

---

## 11. Change Log

- **2025-12-25**: Consolidated all 3DS steps into `/complete` endpoint. Removed separate `/authenticate` and `/fingerprint` endpoints.
- **2025-12-17**: Refactored to use `pending_action` field instead of error codes for 3DS steps.
- **2025-12-16**: Added 3DS Method (device fingerprinting) support.
- **2025-12-16**: Initial draft. Defines 3DS 2.x authentication flow for ACP.
