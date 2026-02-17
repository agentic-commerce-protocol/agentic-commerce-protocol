# RFC: Intervention Types Extension

**Status:** Proposal
**Version:** 2026-02-17
**Scope:** Extend intervention type vocabulary for wallet authentication and interactive checkout flows
**Depends on:** RFC: Capability Negotiation

This RFC extends the intervention type vocabulary in
`InterventionCapabilities` to cover interactive authentication flows
required by wallet-style payment handlers (Stripe Link, Apple Pay,
Google Pay, Shop Pay). It also introduces an `InterventionContext`
object for `intervention_required` error payloads so agents can
determine what action to take.

---

## 1. Motivation

The current `intervention_types` enum covers three values: `3ds`,
`biometric`, and `address_verification`. All three are inline flows
where the agent or buyer completes a step within the existing checkout
session context.

Wallet handlers introduce interactive authentication patterns that
don't fit this model:

- **Stripe Link** (#141): Buyer receives an email or SMS with a
  one-time code, enters it to authenticate, then selects a saved
  payment method.
- **Google Pay**: Buyer may be redirected to Google's authentication
  page, then returned to the checkout flow.
- **Apple Pay**: Buyer completes a biometric prompt on-device (already
  partially covered by `biometric`) or interacts with a system dialog.
- **Shop Pay**: Buyer receives an SMS code to verify identity.

Without intervention types for these patterns, each wallet handler
will invent its own workaround. Since SEP #141 (Stripe Link) is the
first wallet handler being specified, whatever pattern it sets will be
copied. Sorting this out before that handler lands avoids
inconsistency.

### 1.1 Why not reuse `display_context`?

`display_context` describes *how the agent renders* an intervention UI
(native, webview, modal, redirect). Intervention types describe *what
kind of authentication or verification* the buyer needs to complete.
A `3ds` intervention might be displayed via `webview` or `redirect`.
An `otp` intervention might be displayed via `native` (inline text
input) or `modal`. These are orthogonal dimensions.

### 1.2 Gap in error payloads

When a seller returns `intervention_required` in `messages[]`, the
agent currently has no structured way to determine *which* intervention
is needed or *how* to initiate it. The agent gets the error code but
not the intervention type, redirect URL, or challenge details. This
RFC addresses that gap with an `InterventionContext` object.

---

## 2. Goals and non-goals

### 2.1 Goals

1. Add `redirect`, `webview`, and `otp` to the intervention type
   vocabulary.
2. Define clear semantics for each type so agents can accurately
   declare capabilities and sellers can set requirements.
3. Introduce `InterventionContext` for `intervention_required` error
   payloads.
4. Maintain backward compatibility — existing `3ds`, `biometric`,
   and `address_verification` types are unchanged.

### 2.2 Non-goals

- Defining wallet-specific authentication flows (that belongs in
  each wallet handler's SEP).
- Changing the capability negotiation mechanism itself.
- Specifying how agents render specific intervention UIs (that's
  the agent's implementation detail).

---

## 3. Specification

### 3.1 New intervention types

Three new values are added to the `supported` and `required`
intervention type enums:

| Type | Description | Agent capability required |
|------|-------------|-------------------------|
| `redirect` | Buyer completes authentication at an external URL (OAuth-style). The seller provides a URL; the buyer navigates to it, authenticates, and is returned via callback. | Agent can navigate the buyer to an external URL and handle a return callback. |
| `webview` | Buyer interacts with an embedded UI component rendered by a payment provider's SDK or iframe. | Agent can render embedded web content within the checkout context. |
| `otp` | Buyer enters a one-time code delivered via email or SMS. The seller triggers code delivery; the agent prompts the buyer for the code and relays it back. | Agent can prompt the buyer for text input and submit it to the seller. |

The `supported` enum becomes:
```
["3ds", "biometric", "address_verification", "redirect", "webview", "otp"]
```

The `required` enum becomes:
```
["3ds", "biometric", "redirect", "webview", "otp"]
```

`address_verification` remains excluded from `required` since it is
a passive check that doesn't block checkout completion.

### 3.2 Capability negotiation

The negotiation flow is unchanged. Agents declare supported
intervention types in requests; sellers return the intersection in
responses and list required types.

**Agent request example:**
```json
{
  "capabilities": {
    "interventions": {
      "supported": ["3ds", "otp", "redirect"],
      "display_context": "native",
      "redirect_context": "external_browser",
      "max_redirects": 2
    }
  }
}
```

**Seller response (Stripe Link checkout):**
```json
{
  "capabilities": {
    "interventions": {
      "supported": ["otp"],
      "required": ["otp"],
      "enforcement": "always"
    }
  }
}
```

If the agent does not declare `otp` in `supported` but the seller
requires it, the existing mismatch error handling applies — the
seller returns a capability mismatch error per the Capability
Negotiation RFC.

### 3.3 InterventionContext

A new `InterventionContext` object is added to the schema. It appears
on the `CheckoutSession` response when the session status indicates
an intervention is pending.

```json
{
  "type": "object",
  "additionalProperties": true,
  "description": "Context for a pending intervention. Present on the session when an intervention_required message is active.",
  "properties": {
    "intervention_type": {
      "type": "string",
      "enum": ["3ds", "biometric", "address_verification", "redirect", "webview", "otp"],
      "description": "The type of intervention the buyer needs to complete."
    },
    "redirect_url": {
      "type": "string",
      "format": "uri",
      "description": "URL the buyer should be directed to (redirect and webview types)."
    },
    "callback_url": {
      "type": "string",
      "format": "uri",
      "description": "URL the buyer returns to after completing the redirect flow."
    },
    "challenge_hint": {
      "type": "string",
      "description": "Human-readable hint about where the challenge was sent (e.g., 'Code sent to k***@gmail.com'). For otp type."
    },
    "expires_at": {
      "type": "string",
      "format": "date-time",
      "description": "When this intervention context expires."
    },
    "provider": {
      "type": "string",
      "description": "The payment handler or provider that triggered this intervention."
    }
  },
  "required": ["intervention_type"]
}
```

**Fields by intervention type:**

| Field | redirect | webview | otp | 3ds | biometric |
|-------|----------|---------|-----|-----|-----------|
| `intervention_type` | required | required | required | required | required |
| `redirect_url` | required | required | — | — | — |
| `callback_url` | required | optional | — | — | — |
| `challenge_hint` | — | — | recommended | — | — |
| `expires_at` | recommended | recommended | recommended | recommended | — |
| `provider` | optional | optional | optional | optional | optional |

For `3ds` interventions, agents should continue using the existing
`authentication_metadata` field. `InterventionContext` provides
the type signal; `authentication_metadata` provides the 3DS-specific
parameters.

### 3.4 Session-level placement

`intervention_context` is added as an optional field on
`CheckoutSession`, alongside the existing `authentication_metadata`:

```json
{
  "intervention_context": {
    "$ref": "#/$defs/InterventionContext",
    "description": "Context for a pending buyer intervention. Present when an intervention is needed to proceed."
  }
}
```

This field is set by the seller when intervention is required and
cleared when the intervention is completed or the session moves past
the intervention state.

### 3.5 OTP submission

For `otp` interventions, the agent collects the code from the buyer
and submits it via the existing `update_checkout_session` endpoint.
The OTP value is passed in a new optional field on the update request:

```json
{
  "intervention_response": {
    "type": "otp",
    "code": "123456"
  }
}
```

The `InterventionResponse` object:

```json
{
  "type": "object",
  "additionalProperties": true,
  "description": "Agent's response to a pending intervention.",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["otp", "redirect_complete", "webview_complete"],
      "description": "The intervention type being responded to."
    },
    "code": {
      "type": "string",
      "description": "One-time code entered by the buyer (otp type)."
    },
    "callback_data": {
      "type": "string",
      "description": "Data received from the redirect callback (redirect_complete type)."
    }
  },
  "required": ["type"]
}
```

For `redirect` and `webview` interventions, the agent signals
completion by sending an update with `intervention_response.type`
set to `redirect_complete` or `webview_complete`, optionally
including any callback data.

---

## 4. Rationale

### 4.1 Mechanism-based vs provider-specific types

We considered provider-specific types (`stripe_link_auth`,
`apple_pay_auth`, `google_pay_auth`) but rejected them because:

- New providers would require enum additions each time.
- Agents would need per-provider logic rather than per-mechanism logic.
- Mechanism-based types are composable — Stripe Link and Shop Pay
  both use `otp`, so an agent that supports `otp` handles both.

### 4.2 Why `redirect` is a separate type from `webview`

While both involve rendering web content, they require different agent
capabilities:

- `redirect` navigates away from the current context. The agent must
  handle a full navigation + callback flow. This may not be possible
  in all environments (e.g., a CLI agent).
- `webview` embeds content inline. The agent must render an iframe or
  equivalent. This may not be possible in environments without a
  rendering engine.

An agent might support one but not the other, so they must be declared
separately for accurate capability negotiation.

### 4.3 InterventionContext vs extending MessageError

We considered adding intervention fields directly to `MessageError`
but chose a separate session-level object because:

- Intervention context persists across multiple API calls (the buyer
  may take time to complete the flow). Tying it to a single error
  message creates lifecycle issues.
- Other API calls during the intervention (e.g., polling for status)
  need access to the context without re-triggering the error.
- Session-level placement aligns with how `authentication_metadata`
  already works for 3DS.

### 4.4 Why `address_verification` stays out of `required`

Address verification is a passive check against buyer-provided data.
It doesn't require an interactive flow — the seller validates the
address in the background. Including it in `required` would imply the
buyer must take an action, which doesn't match the semantics.

---

## 5. Backward compatibility

This change is additive:

- New enum values are added to existing arrays. Agents and sellers
  that don't support the new types simply don't include them in
  `supported`/`required`.
- `InterventionContext` and `intervention_response` are new optional
  fields. Existing implementations ignore them.
- The capability negotiation mechanism is unchanged.
- Existing `3ds`, `biometric`, and `address_verification` types
  continue to work identically.

Implementations MUST NOT reject payloads containing unrecognized
intervention types, per the forward-compatibility requirements in the
Capability Negotiation RFC.

---

## 6. Security considerations

### 6.1 Redirect URL validation

Agents MUST validate `redirect_url` before navigating the buyer.
At minimum:

- The URL must use HTTPS.
- The domain should match the seller's known domain or a recognized
  payment provider.
- Agents should warn buyers before navigating to external URLs.

### 6.2 OTP handling

- Agents MUST NOT log or persist OTP codes.
- OTP codes should be transmitted only via the
  `intervention_response.code` field, never in free-text fields.
- `challenge_hint` MUST be partially redacted (e.g., `k***@gmail.com`,
  not `karthik@gmail.com`).

### 6.3 Intervention context expiration

Sellers SHOULD set `expires_at` on intervention contexts.
Agents SHOULD treat expired contexts as failed and re-request
the intervention or cancel the session.

---

## 7. Examples

See `examples/unreleased/intervention-types/` for complete
request/response examples covering:

- OTP flow (Stripe Link style)
- Redirect flow (Google Pay style)
- Capability negotiation with new types
- Intervention context on session response
