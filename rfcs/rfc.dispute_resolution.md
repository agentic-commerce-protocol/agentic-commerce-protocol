# RFC: Dispute Resolution Extension (ATDRP)

**Status:** Draft
**Version:** 2026-10-16
**Scope:** Post-transaction dispute resolution for agent-initiated purchases
**Depends on:** RFC: ACP Extensions Framework, RFC: Enhanced Order Support
**SEP:** #303

This RFC defines the **Dispute Resolution Extension**, an extension under the
ACP Extensions Framework. It lets merchants and agent platforms agree a
**dispute resolution provider** at checkout, defines a **dispute record** whose
evidence is the AP2 mandate and receipt artifacts and the ACP Order, defines a
**determination** that the merchant records as an `Order` adjustment of type
`dispute`, and specifies the published **policy** (ATDRP) a conforming provider
follows.

---

## 1. Scope & Goals

- Let merchants and agents **advertise and agree a provider** at checkout
- Define a **dispute record** by reference to artifacts the protocols already
  produce; no new evidence type
- Define a **determination** (uphold / overturn per line, amount, reasons,
  factors, signer, seal) recorded as an `Order.adjustment` of type `dispute`
- Specify the **policy** (ATDRP-0.1): scope, permitted and prohibited
  considerations, decision rule, clocks, fee, sign-off, independence,
  verification, transparency

**Out of scope:** fraud and unauthorized-mandate claims (routed to the payment
network's fraud process), the provider's internal case-management system, the
transport by which a party opens a dispute at a provider (see Open Questions),
refund execution mechanics (RFC: Delegated Payment lists refund semantics as out
of scope), and any change to network chargeback rules.

---

## 2. Motivation

### 2.1 The Gap

ACP and AP2 together produce a signed record of an agent-initiated purchase: a
merchant-signed checkout, a payment mandate, and receipts binding both. Neither
protocol defines what happens when the parties disagree after the transaction
and the disagreement is not fraud:

- the agent bought within its mandate but the merchant did not perform
- the charge exceeded the mandate
- the mandate was executed after expiry or reused
- the cart the agent confirmed did not match the user's instruction

### 2.2 What the Protocols Say Today

- AP2's dispute language is limited to its audit trail "aiding in dispute
  resolution".
- ACP's Delegated Payment spec keeps the merchant as merchant of record and
  places settlement, refunds, chargebacks and compliance with the merchant and
  PSP; RFC: Delegated Payment lists "refund semantics" as out of scope.
- RFC: Enhanced Order Support defines an `Adjustment` of type `dispute` but no
  process that produces one.

### 2.3 What This Extension Adds

- A provider agreement mechanism at checkout, patterned on payment handlers
- A dispute record composed entirely of existing artifacts
- A deterministic, reproducible decision rule
- A determination schema and its recording as an order adjustment

The SEP issue (#303) carries the market evidence and sources for the gap.

---

## 3. Extension Declaration

Merchants advertise support in the checkout response:

```json
{
  "capabilities": {
    "extensions": [
      {
        "name": "dispute_resolution",
        "extends": [
          "$.CheckoutSession.dispute_resolution",
          "$.CheckoutSessionCompleteRequest.dispute_resolution",
          "$.Order.adjustments"
        ],
        "spec": "https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/303"
      }
    ]
  }
}
```

Agents declare the extension in `capabilities.extensions: ["dispute_resolution"]`.

| JSONPath | Description |
|----------|-------------|
| `$.CheckoutSession.dispute_resolution` | Adds the `dispute_resolution` object to responses |
| `$.CheckoutSessionCompleteRequest.dispute_resolution` | Adds `selected_provider` to complete requests |
| `$.Order.adjustments` | Admits `Adjustment` entries of type `dispute` carrying a determination |

The extension is active only when both sides declare it **and** a provider is
agreed (Section 5.2). Otherwise the session proceeds with no provider.

---

## 4. Schema

Schemas are defined in `spec/unreleased/json-schema/schema.dispute_resolution.json`
and mirrored in `schema.agentic_checkout.json` and
`openapi.agentic_checkout.yaml`. Monetary values use the repository convention
of integer minor units with a `currency` (see Open Questions).

### 4.1 DisputeResolution (on `CheckoutSession`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `providers` | DisputeProviderRef[] | Yes | Providers the merchant accepts, in preference order |
| `selected_provider` | string | No | `provider_id` agreed for this session (set by the agent on complete) |
| `policy_url` | string (uri) | Yes | The provider's published policy the parties are bound by |
| `fee` | DisputeAmount | Yes | Loser-pays fee for a single-line resolution, in minor units |
| `window_days` | integer | Yes | Days after `payment_receipt.iat` within which a dispute may be opened |

### 4.2 DisputeProviderRef

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider_id` | string | Yes | Stable identifier of the provider |
| `name` | string | Yes | Human-readable name |
| `policy_url` | string (uri) | Yes | The provider's published policy |
| `verify_url` | string (uri) | No | Where determinations can be verified |

### 4.3 DisputeResolutionRequest (on `CheckoutSessionCompleteRequest`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `selected_provider` | string | Yes | `provider_id` the agent selects |

### 4.4 DisputeRecord

Opened by either party at the provider. Every evidence field is **by reference**
to an existing AP2 or ACP schema; this extension adds no new evidence type.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dispute_id` | string | Yes | Dispute identifier |
| `policy_version` | string | Yes | Policy version, e.g. `ATDRP-0.1` |
| `claimant` | string | Yes | `payer` or `merchant` |
| `checkout_hash` | string | Yes | AP2 `checkout_mandate.checkout_hash` |
| `payment_mandate` | object | Yes | AP2 payment mandate: `transaction_id`, `payee`, `payment_amount`, `iat`, `exp`, `execution_date`, `risk_data` |
| `checkout_receipt` | object | Yes | AP2 checkout receipt: `status`, `reference`, `iat`, `order_id` |
| `payment_receipt` | object | Yes | AP2 payment receipt: `status`, `reference`, `iat`, `payment_id`, `psp_confirmation_id`, `network_confirmation_id` |
| `order` | object | Yes | ACP Order: `id`, `status`, `line_items[]`, `fulfillments[]`, `adjustments[]`, `estimated_delivery` |
| `user_instruction` | string | No | The user's instruction, retained by the agent platform |
| `confirmed_cart` | object | No | What the agent confirmed |
| `claim` | DisputeClaim | Yes | The claim |

`DisputeClaim`: `line_ids` (string[]), `ground` (`scope`, `performance`,
`intent` or `amount`), `statement` (at most 2000 characters).

The provider **MUST** verify `payment_mandate.transaction_id == checkout_hash`
and that each receipt's `reference == checkout_hash` before accepting the
dispute. A failed check is returned as `not_eligible: authorization_chain_broken`
and the parties are directed to the network fraud process.

### 4.5 DisputeDetermination

Returned by the provider; recorded by the merchant as an `Order` adjustment of
type `dispute` (Section 6).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `determination_id` | string | Yes | Determination identifier |
| `dispute_id` | string | Yes | The dispute resolved |
| `policy_version` | string | Yes | Policy version applied |
| `per_line` | DisputeDeterminationLine[] | Yes | `line_id`, `outcome` (`uphold` or `overturn`), `amount`, `reasons[]` |
| `factors` | object | Yes | `mandate_scope`, `intent_fidelity`, `merchant_performance`, `adjustments_already_made`, `agent_platform_conduct` |
| `prohibited_screened` | boolean | Yes | Provider screened for and excluded prohibited considerations |
| `drafted_by` | string | No | Disclosure of AI assistance (Section 7.7) |
| `signer` | object | Yes | `name`, `credential` of the named natural person |
| `issued_at` | string (date-time) | Yes | RFC 3339 timestamp |
| `seal` | object | Yes | `record_hash`, `chain_head`, `verify_url` |
| `fee_disposition` | object | Yes | `paid_by` (`payer` or `merchant`), `amount` |

---

## 5. Operations

### 5.1 Advertising

The merchant returns `dispute_resolution` on the checkout session with the
providers it accepts, in preference order, plus `policy_url`, `fee` and
`window_days`.

### 5.2 Agreement

The agent sets `selected_provider` on the complete request. The agent **MAY**
propose a provider not in `providers`; the merchant **MAY** refuse. Absent
agreement the session proceeds with no provider and the extension is inactive:
no dispute record can be opened under this extension, and legacy chargeback
rights are untouched.

### 5.3 Opening a dispute

Either party opens a dispute at the agreed provider within `window_days` of
`payment_receipt.iat` by submitting a DisputeRecord. The transport is not
defined by this RFC (see Open Questions).

---

## 6. Recording a Determination

`overturn` amounts are executed by the merchant's PSP as a refund against
`payment_receipt.payment_id`. The merchant records an `Adjustment` with
`type: "dispute"` and `status: "completed"` and the determination's
`seal.verify_url`. This RFC adds the optional `dispute_determination` property
to `Adjustment` to carry the determination (see Open Questions).

A determination is final under the policy; either party retains whatever rights
network rules or law give them outside this extension.

---

## 7. Policy (normative for providers claiming conformance): ATDRP-0.1

### 7.1 Scope

Disputes inside an intact authorization chain: mandate scope (amount, payee,
expiry, reuse), merchant performance (per ACP Order), intent fidelity (only when
the platform retained the instruction). Fraud and unauthorized-mandate claims
are out of scope and routed to the network.

### 7.2 Permitted considerations

The five factors in Section 4.5. Nothing else.

### 7.3 Prohibited considerations

Party size or reputation; dispute or chargeback history outside this record; any
reference to network monitoring programs or ratios. Providers **MUST** screen
submissions for these and **MUST** state in the determination that they were
excluded (`prohibited_screened`).

### 7.4 Decision rule (deterministic, reproducible)

Per line:

1. A completed refund or credit greater than or equal to the line amount:
   **uphold** (moot). A line-labelled adjustment counts in full; an order-level
   adjustment is allocated pro rata by line amount so one refund can never moot
   more than one line's worth of exposure.
2. Charge greater than the mandate: **overturn** the excess. Execution after
   `exp`, or mandate reuse: **overturn** the line.
3. Merchant `canceled` without a completed adjustment: **overturn**. Unfulfilled
   units after the merchant's own `estimated_delivery`: **overturn** the
   unfulfilled share.
4. Instruction/cart conflict: recorded as a finding against the agent platform;
   it does **not** reverse the merchant's charge (the merchant performed what the
   agent confirmed).
5. Otherwise: **uphold**.

### 7.5 Clocks (calendar days)

Open within `window_days` (default 120) of `payment_receipt.iat`; eligibility
(chain, window, receipt status) within 2; submissions within 5; signed
determination within 10.

### 7.6 Fee

Loser pays the provider's published per-resolution fee (single-line default
range $1 to $50; batched $5 to $250), pre-funded by both sides through the
platform or PSP and returned to the prevailing party.

### 7.7 Human sign-off

A determination **MUST** be signed by a named natural person holding a
credential the provider publishes (arbitration training or bar admission). AI
assistance is permitted and **MUST** be disclosed in the record (`drafted_by`).

### 7.8 Provider independence

A provider **MUST NOT** be, or be controlled by, a party to the dispute, a
payment network, a PSP settling the disputed payment, or the agent platform that
executed the mandate. Revenue from any single party class above a published
threshold **MUST** be disclosed.

### 7.9 Public verification

Every determination **MUST** be verifiable at `seal.verify_url` without an
account, forever.

### 7.10 Transparency

Providers **MUST** publish, at k-anonymity of at least 11: volume, median days
to determination, uphold/overturn rates by ground, and fee schedule.

---

## 8. Examples

Complete payloads are in `examples/unreleased/`:

| Example | File | Key |
|---------|------|-----|
| Capability declaration (merchant, agent) | `examples.dispute_resolution.json` | `capability_declaration`, `agent_capability_declaration` |
| Checkout with `dispute_resolution` | `examples.agentic_checkout.json` | `checkout_session_with_dispute_resolution` |
| Complete request selecting a provider | `examples.agentic_checkout.json` | `complete_checkout_session_request_with_dispute_resolution` |
| Dispute record | `examples.dispute_resolution.json` | `dispute_record` |
| Determination | `examples.dispute_resolution.json` | `dispute_determination` |
| Order adjustment of type `dispute` | `examples.agentic_checkout.json` | `complete_checkout_session_response_with_dispute_adjustment` |

---

## 9. Backward Compatibility

No breaking changes. The extension is optional and inactive unless both sides
declare it and a provider is agreed. `Order.adjustments` already admits type
`dispute`. The new properties (`CheckoutSession.dispute_resolution`,
`CheckoutSessionCompleteRequest.dispute_resolution`,
`Adjustment.dispute_determination`) are optional; no existing field changes
semantics. Clients without extension support ignore the new properties.

---

## 10. Security Considerations

- The provider receives mandates and receipts, not payment credentials;
  `payment_instrument` is never required. `risk_data` is optional and **MUST** be
  minimized.
- Chain verification (Section 4.4) is the anti-forgery control: a dispute cannot
  be opened on a mandate the receipts do not bind to.
- Prohibited-consideration screening prevents the record from being used to
  pressure a neutral with network-ratio threats.
- Sealed, publicly verifiable determinations prevent after-the-fact alteration by
  any party, including the provider.
- Privacy: determinations publish outcome and reasons, never the user instruction
  verbatim; aggregate statistics are k-anonymous at 11 or more.

---

## 11. Conformance Checklist

**Merchant**

- [ ] Declares `dispute_resolution` in `capabilities.extensions`
- [ ] Returns `providers`, `policy_url`, `fee`, `window_days`
- [ ] Executes `overturn` amounts as a refund against `payment_receipt.payment_id`
- [ ] Records the determination as an `Adjustment` of type `dispute`, status `completed`

**Agent platform**

- [ ] Declares `dispute_resolution` in `capabilities.extensions`
- [ ] Sets `selected_provider` on complete when agreeing a provider
- [ ] Retains `user_instruction` if intent-fidelity disputes are to be possible

**Provider**

- [ ] Verifies the authorization chain before accepting a dispute (Section 4.4)
- [ ] Applies the decision rule of Section 7.4 and the clocks of Section 7.5
- [ ] Meets Sections 7.7 to 7.10

---

## 12. Open Questions

These points are underspecified in SEP #303. This RFC does not decide them.

1. **Amount representation.** SEP #303 writes `Amount`. This RFC uses the
   repository convention of an integer in minor units plus a lowercase
   `currency` (`DisputeAmount`). Confirm or replace.
2. **Proposing an unlisted provider.** Section 5.2 says the agent MAY propose a
   provider not in `providers`, but no field or message carries the proposal.
   `selected_provider` today carries only a `provider_id`.
3. **Opening a dispute.** The channel, authentication and API by which a party
   submits a DisputeRecord to a provider, and the format of the
   `not_eligible: authorization_chain_broken` response, are not specified.
4. **Evidence field types.** Evidence is by reference to AP2 schemas. This RFC
   types only the fields used for chain verification and leaves the rest open
   (`additionalProperties: true`). Which AP2 schema version is pinned is open.
5. **Shape of `factors`.** The five factor names are fixed; the structure of each
   value is not specified.
6. **Carrying the determination on an Order.** SEP #303 says the determination is
   recorded as an adjustment with the seal's `verify_url`. This RFC adds an
   optional `dispute_determination` property to `Adjustment`. Alternatives are a
   reference-only property (`determination_id`, `verify_url`) or reuse of
   `reason` and `description`.
7. **Required fields.** Which `DisputeProviderRef` and `DisputeClaim` fields are
   required is inferred here (`verify_url` optional, `line_ids` required).
8. **Fee pre-funding.** "Pre-funded by both sides through the platform or PSP"
   has no defined mechanism, currency handling or refund flow.
9. **`window_days` default.** The policy default is 120 but the field is
   required on the session; whether a provider default applies when a merchant
   omits it is not stated.
10. **Adjustment status.** Whether a `pending` `dispute` adjustment is recorded
    between opening and determination is not stated; only the `completed`
    adjustment is specified.
11. **Relation to network chargebacks.** The extension leaves legacy chargeback
    rights untouched but does not say how a pre-existing chargeback adjustment
    interacts with an open dispute beyond rule 7.4(1).

---

## 13. Change Log

- **2026-10-16**: Initial draft (SEP #303).

---

## Appendix A (informative): Reference implementation

SEP #303 describes a reference implementation of Sections 4 and 7 offered under
Apache 2.0 on acceptance, and a dependency-free demonstration of the same
evidence model proposed as an AP2 sample (google-agentic-commerce/AP2#352). Both
are described in the SEP issue and are not part of this specification.

## Appendix B (informative): Files in this SEP

- `rfcs/rfc.dispute_resolution.md`
- `spec/unreleased/json-schema/schema.dispute_resolution.json`
- `spec/unreleased/json-schema/schema.agentic_checkout.json` (mirrored definitions)
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml` (mirrored definitions)
- `examples/unreleased/examples.dispute_resolution.json`
- `examples/unreleased/examples.agentic_checkout.json` (three added examples)
- `scripts/validate-consistency.js` (validates the new examples file)
- `changelog/unreleased/dispute-resolution-extension.md`

---

## Appendix C (non-normative): Card-rail mapping of ATDRP evidence

Status: draft for SEP #303. Co-authored with @Flyingmiata-droid. Every cell is read from the vendor's own public
documentation on the date shown; cells say UNKNOWN when the documentation could not be read.

### Why this appendix exists
ATDRP's dispute record carries protocol artifacts (merchant-signed checkout, payment mandate, receipts). When the
underlying payment ran on a card rail, the chargeback is decided by the issuer from the network reason code and the
evidence the merchant submits through its gateway. This appendix records, per gateway, (a) whether the merchant
receives an agent signal, (b) whether the dispute object links back to it, and (c) whether any documented field can
carry it to the issuer.

Finding at the time of writing: merchants can recover the agent signal in one lookup on two gateways, but **no
gateway documents a structured way to put it in front of the issuer**.

### Mapping table

| Gateway | Agent signal to merchant | Dispute links back to payment | Field that can reach the issuer | ATDRP artifact that could ride there | Read on |
|---|---|---|---|---|---|
| Stripe | `PaymentIntent.agent_details` (`name`, `network_business_profile`), API version 2026-09-30.preview | Yes: `Dispute.payment_intent` (expandable) | None structured; free-text/file evidence only (`evidence.uncategorized_text`, `uncategorized_file`) | mandate + receipt as an uncategorized file | 2026-10-16 |
| Braintree | `transaction.facilitator_details` (`oauth_application_name`, `oauth_application_client_id`), response only | Yes: `dispute.transaction.id` | None structured; evidence comment/file upload only | mandate + receipt as file evidence | 2026-10-16 |
| Adyen | Request side only: `shoppingPlatform` (Agentic Cart API), `metadata.agentPlatform` (UCP); AUTHORISATION webhook echoes `shoppingPlatform` in `additionalData`; nothing on the `/payments` response | Yes: dispute webhook `originalReference` ("The PSP reference of the disputed payment") | None structured; defense documents uploaded as PDF through the Disputes API. Help Center routes Visa CE 3.0 elements through Adyen Support | mandate + receipt as a PDF defense document | 2026-10-15; link 2026-10-16 |
| Worldpay | Request side only: `instruction.paymentInstrument.type` = `delegate` (ACP); payment response has no agent or delegate term | UNKNOWN (docs not readable) | UNKNOWN (docs not readable) | | 2026-10-15; link 2026-10-16 |
| Checkout.com | none documented (2025 blog mentions providing issuers "the original consent record"; not in docs) | Yes: `Dispute.payment.id` (`payment_id` in list results) | None structured; `additional_evidence_file` / `additional_evidence_text`, `invoice_or_receipt_file` | mandate as additional evidence file, receipt as `invoice_or_receipt_file` | 2026-10-15; link 2026-10-16 |
| Shopify Payments | none documented as a field; admin shows "channel or referrer attribution" for AI channel orders | Order only: `ShopifyPaymentsDispute.order`; no payment transaction field | none documented | | 2026-10-15; link 2026-10-16 |
| Square | none documented as a value; `OrderSource.name` exists, Dashboard groups AI assistant orders by source | Yes: `Dispute.disputed_payment.payment_id` | none documented in the pages read | | 2026-10-15; link 2026-10-16 |
| PayPal (wallet, Orders v2) | none documented: no agent or facilitator field; `stored_credential.payment_initiator` is `CUSTOMER` or `MERCHANT` only | Yes: `disputed_transactions[].seller_transaction_id` | Wallet disputes are decided by PayPal, not an issuer; evidence goes to PayPal as files and notes, none structured for agents | mandate + receipt as file evidence | 2026-10-15; link 2026-10-16 |
| Cybersource | agent-side API only; nothing merchant-side | Report only: Chargeback Report `RequestId`, `MerchantReferenceNumber` | none documented | | 2026-10-15; link 2026-10-16 |
| Nuvei | none documented (TAP pilot announced, H2 2026 target) | Report only: Chargebacks Report `Transaction ID`; no chargeback notification documented | none documented | | 2026-10-15; link 2026-10-16 |
| Fiserv Commerce Hub | UNKNOWN (docs not readable) | UNKNOWN | UNKNOWN | | 2026-10-15 |
| Global Payments | UNKNOWN (docs not readable) | UNKNOWN | UNKNOWN | | 2026-10-15 |
| Elavon Converge | UNKNOWN (docs not readable) | UNKNOWN | UNKNOWN | | 2026-10-15 |
| Elavon Payment Gateway | none documented (OpenAPI spec version 2026-07-21: no agentic, Agent Pay, Intelligent Commerce or Trusted Agent terms) | Network references only: `GET /disputes/{disputeId}/transaction` returns `acquirerReferenceNumber`, `rocText`; no gateway transaction ID | none documented | | 2026-10-15; link 2026-10-16 |
| NMI | none documented | Unclear: `chargeback.batch.complete` webhook carries `chargebacks[].id`; docs do not say it is the original transaction ID | none documented | | 2026-10-15; link 2026-10-16 |
| Authorize.net | none documented | none documented (only eCheck batch `chargebackCount`) | none documented | | 2026-10-15; link 2026-10-16 |
| Helcim | none documented | none documented (chargebacks are dashboard only; no dispute API in devdocs) | none documented | | 2026-10-15; link 2026-10-16 |

"None documented" means the vendor's public docs, API reference and dispute guides were read and say nothing; it is not a claim that no such capability exists. UNKNOWN means the docs could not be read. Neither means NO.

### What would close the gap (informative)
1. A structured agent indicator in the network dispute evidence schema (for example alongside existing compelling-evidence
   data elements).
2. Until then, ATDRP recommends attaching the signed mandate and receipts as file evidence and stating the
   agent-initiated nature in the free-text field.
