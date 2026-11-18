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
| `approval_digest` | string | No | `approval_digest` of the user's approval of this cart (Section 4.4a), when the agent platform keeps one |

### 4.4 DisputeRecord

Opened by either party at the provider. Every evidence field is **by reference**
to an existing AP2 or ACP schema, except `user_approval` (Section 4.4a), which
binds what the user approved to the checkout.

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
| `user_approval` | UserApproval | No | What the user approved, bound to the checkout by digest (Section 4.4a) |
| `confirmed_cart` | object | No | What the agent confirmed |
| `claim` | DisputeClaim | Yes | The claim |

`DisputeClaim`: `line_ids` (string[]), `ground` (`scope`, `performance`,
`intent` or `amount`), `statement` (at most 2000 characters).

The provider **MUST** verify `payment_mandate.transaction_id == checkout_hash`
and that each receipt's `reference == checkout_hash` before accepting the
dispute. The comparisons are exact string equality, with no normalization of
case or encoding. A failed check is returned as `not_eligible: authorization_chain_broken`
and the parties are directed to the network fraud process.

### 4.4a UserApproval

What the user approved, kept by the agent platform and bound to the checkout.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | array | Yes | Approved items: `sku` (string), `variant` (string, optional), `quantity` (integer) |
| `approved_at` | string (RFC 3339) | Yes | When the user approved |
| `approval_digest` | string | Yes | Lowercase hex SHA-256 of the RFC 8785 (JCS) form of `{items, approved_at}` |

The agent sends `approval_digest` on `CheckoutSessionCompleteRequest.dispute_resolution`
(Section 4.3), so the merchant's record of the session holds it before any
dispute exists. A provider **MUST** recompute the digest from `items` and
`approved_at`, and **MUST** check it equals the `approval_digest` the merchant
received on complete. Only a `user_approval` that passes both checks is
evidence of what the user approved; otherwise it, like `user_instruction`, is a
statement of the agent platform only. `user_approval` carries no customer
details: product identifiers, quantities and a time.

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
| `opened_at` | string (date-time) | Yes | RFC 3339 time the provider received the DisputeRecord |
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
the platform retained the instruction or a `user_approval`). Fraud and unauthorized-mandate claims
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
   more than one line's worth of exposure. Only a completed adjustment of type
   `refund`, `credit` or `price_adjustment` counts; other types (`return`,
   `exchange`, `cancellation`, `dispute`, and unrecognized values) do not. An
   adjustment that names no line is allocated pro rata by line amount over the
   lines with a known amount.
2. Charge greater than the mandate: **overturn** the excess. Execution after
   `exp`, or mandate reuse: **overturn** the line. The charge is the order total,
   compared with `payment_amount`. Execution is after `exp` when the UTC date of
   `execution_date` is later than the UTC date of `exp`; the same day is not after.
3. Merchant `canceled` without a completed adjustment of a type counted in rule 1:
   **overturn**. Unfulfilled units after the merchant's own `estimated_delivery`:
   **overturn** the unfulfilled share. Unfulfilled is `quantity.current` (else `quantity.ordered`)
   minus `quantity.fulfilled`, assessed after the order's
   `estimated_delivery.latest`; a fulfillment's own estimate does not extend it.
4. Instruction/cart conflict: recorded as a finding against the agent platform;
   it does **not** reverse the merchant's charge (the merchant performed what the
   agent confirmed). With a `user_approval` that passes Section 4.4a, a disputed
   line whose `sku` or `variant` matches no approved item is that finding, decided
   on the bound approval rather than on the platform's statement.
5. Otherwise: **uphold**.

A line's amount is its `subtotal`; without one, `unit_price` times
`quantity.ordered`.

### 7.4a Evidence-pack verdicts (admissibility)

When evidence arrives as a signed, self-contained pack (for example the AP2
dispute-time evidence format discussed in google-agentic-commerce/AP2#338), the
provider runs a fail-closed pack verifier **before** Section 7.4 and applies
this table. Conditions are stated as verifier output fields, not as
conformance-vector names (the vector names in parentheses are examples only).

| Verifier output | Admissibility | Effect on Section 7.4 |
|---|---|---|
| `valid: true` under the provider's policy (`valid_signed`) | Admissible | Apply 7.4 normally |
| `digest_ok: false` (`digest_mismatch`), or `rfc3161_verified: false` / a failed `anchors` binding (`anchor_invalid`) | Not admissible (tamper) | The pack is excluded. The submitting party may resubmit within the 7.5 clock; the determination **MUST NOT** rely on the excluded pack |
| `producer_present: false` (`stripped_signature`) | Admissible only for facts the mandate's own signature proves | Producer-level claims (who assembled the pack, retention integrity) carry no weight |
| `producer_ok: true`, `producer_trusted: false` (`unpinned_producer`) | Consistency-only | It **MUST NOT** be the sole basis for an `overturn` |
| `anchors_verified: 0` with `rfc3161_claimed: false` (`anchor_missing`) | Admissible | A time-based ground (execution after `exp`) needs an independent timestamp (PSP or network confirmation); otherwise that ground is not met |

Provider policy requirements:

1. The evidence digest covers sealed content only, not signatures or anchors,
   so a reference by digest cannot distinguish a signed or anchored original
   from a stripped or re-signed copy. Providers **MUST** either record the
   SHA-256 of the whole pack file, or verify with pinned producer keys
   (`require_producer`) and, when a time-based ground rests on the pack's
   anchor, `require_anchor` (or `min_anchors`).
2. When the verifier reports `self_asserted_only: true` (mandate keys carried
   in the pack itself), the mandate signature proves consistency, not issuer
   identity. Providers **MUST** match those keys against the issuer's published
   keys out of band before treating the mandate as the issuer's, and **MUST**
   record whether they did.

3. A verifier result meaning "no check ran" is not tamper. `key_unresolved`
   (the verifier's trust material did not resolve the signer) **MUST NOT** be
   treated as `signature_invalid`: the provider resolves the keys out of band,
   then re-verifies, and records both steps. A missing counterparty record
   (`no_record`) maps to `not_responded`; silence **MUST NOT** be treated as
   acceptance.
4. Where evidence includes a work-acceptance record (a checking party's
   findings against stated criteria), the provider gives it weight only if the
   criteria were committed before the deliverable existed (bound to terms the
   counterparty signed or to an earlier anchored timestamp), the checker's key
   is not the producer's, and no required criterion is `not-evaluated`.
5. A pack built from a ledger (lifecycle records written over time) proves
   internal consistency, not when its records existed. Completeness within a
   boundary and an external time anchor for the boundary are separate
   requirements and fail separately (raised in AP2#338 by nmatt1 and
   Tetsurohhori). For completeness, the pack carries the boundary identifier,
   the sequence fields of each record (as in AP2#290), and a close commitment
   for the boundary: the head of the record chain and the record count. The
   provider recomputes the head from the records presented and checks that
   the count matches; a mismatch in either is a finding that records were
   withheld or altered. The close commitment is part of the anchored set, so
   committing again to a shorter set needs a new anchor with a later time. For the
   anchor, the pack carries the anchored digest, the mechanism (`rfc3161` or
   `opentimestamps`), the proof bytes, and where the anchored set can be
   recomputed. The provider recomputes the digest and verifies the proof: an
   RFC 3161 token against time-stamp authority roots the provider chooses, an
   OpenTimestamps proof against a block header the provider obtains itself.
   An anchor attests that the set existed no later than the anchor time; it
   does not attest that a record in it is true. Records written after the
   last anchor are unanchored and **MUST NOT** be the sole basis for a
   time-based ground. A party may anchor a ledger it does not disclose and
   later prove its contents against the anchored digest; producing the
   anchored set at the dispute, so that the provider can recompute the
   digest, satisfies "where the anchored set can be recomputed". The anchor
   cadence sets how long records stay unanchored, so a ledger-based pack
   **SHOULD** declare its maximum anchor interval; the provider checks the
   observed gaps between consecutive anchors against the declared maximum,
   or against its own policy ceiling if that is stricter, and records any gap
   longer than declared as a finding against the party that kept the ledger.
   A gap within the declaration but over a stricter provider ceiling is
   reported, not held against that party. The records in that window remain
   checkable but are reported as late-anchored. Where no interval is
   declared, the provider reports the longest observed gap and, if it has a
   policy ceiling, any gaps over it, not held against the party that kept the
   ledger (interval suggested by nmatt1, provider ceiling by giskard09, in
   AP2#338).
6. Where evidence includes a delivery receipt (a signed binding of request
   and response digests, for example the `inam-delivery-receipt-v0.1` suite),
   the provider recomputes the receipt identifier and verifies both
   signatures over the RFC 8785 serialization of the signed content, rejecting
   small-order public keys, and checks that the countersigning party named in
   the receipt (`agent_a`) is the buyer in the dispute. A receipt countersigned
   by the buyer, with both digests matching the request and response bytes
   presented, weighs against a non-delivery or wrong-content claim. A receipt without the buyer's
   countersignature decides nothing on its own. A receipt whose digests do not
   match the presented bytes is not evidence that those bytes arrived. The
   presented bytes are themselves evidence from the party that holds them, and
   the provider records who presented them. A receipt shows which bytes
   arrived, not whether they met the agreed criteria (requirement 4)
   (raised in #304 by hheskihoran; test vectors in inamprotocol/inam-protocol
   `interop/delivery`).

The determination **MUST** record the verifier output fields for each pack. A
result that implies an unauthorized mandate routes the claim to the network
under Section 7.1.

### 7.5 Clocks (calendar days)

Open within `window_days` (default 120) of `payment_receipt.iat`; eligibility
(chain, window, receipt status) within 2; submissions within 5; signed
determination within 10.

Days are whole UTC calendar days, counted from the UTC date of
`payment_receipt.iat` to the UTC date the provider received the record
(`opened_at`, also returned with any `not_eligible` result). A
receipt is eligible only when its `status` is `success`. A record whose disputed
line has neither `subtotal` nor `unit_price` is ineligible:
`not_eligible: line_amount_missing`.

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
- [ ] Sends `approval_digest` on complete and retains the `user_approval` it covers, if approval/order disputes are to be decided on a bound approval

**Provider**

- [ ] Verifies the authorization chain before accepting a dispute (Section 4.4)
- [ ] For a ledger-based pack, recomputes the boundary's close commitment (chain head and record count) from the records presented; recomputes the anchored digest and verifies the anchor proof; treats records after the last anchor as unanchored; checks observed anchor gaps against the declared maximum interval (Section 7.4a, requirement 5)
- [ ] Applies the evidence-pack admissibility table of Section 7.4a
- [ ] For a delivery receipt, recomputes the receipt identifier, verifies both signatures (rejecting small-order keys), checks that `agent_a` is the buyer in the dispute, checks both digests against the presented bytes, and records who presented them (Section 7.4a, requirement 6)
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
12. **Mandate reuse.** Rule 7.4(2) overturns a line on mandate reuse, but a
    DisputeRecord carries one payment receipt, so no field shows reuse. How a
    provider establishes reuse (for example from the PSP) is not stated.

---

## 13. Change Log

- **2026-10-16**: Initial draft (SEP #303).
- **2026-10-16**: Section 7.4a added: evidence-pack verifier verdicts mapped to admissibility (from AP2#338).
- **2026-10-17**: Section 7.4a restated on verifier output fields; whole-file hash or pinned-key policy and self-asserted-key handling added (review in AP2#338).
- **2026-10-17**: 7.4a: `key_unresolved` and `no_record` handling; work-acceptance record weighting (review in x402-foundation/tsc#4).
- **2026-10-26**: Section 7.4a requirement 5: completeness is now checkable: the pack carries the boundary identifier, sequence fields and a close commitment (chain head and record count), which the provider recomputes; the close commitment is inside the anchored set; producing an undisclosed anchored set at the dispute satisfies the recompute requirement (from nmatt1 in #316).
- **2026-10-29**: `DisputeDetermination.factors` requires all five considerations in the schema, as Section 4.5 states; in the example, the mandate expires after its execution date, so rule 3 decides the line (from Tetsurohhori in #316).
- **2026-10-29**: Sections 4.4, 4.5, 7.4 and 7.5: readings stated for chain equality, receipt status, the dispute window and the new `opened_at`, line amount and the `line_amount_missing` eligibility code, adjustment types and allocation, expiry, charge and unfulfilled quantity; mandate reuse added as Open Question 12; the `DisputeDetermination` copies in the checkout schema and OpenAPI now match, including the five required `factors` (from Tetsurohhori's cold read in #316).
- **2026-10-24**: Section 7.4a requirement 5: a ledger-based pack SHOULD declare its maximum anchor interval, and observed gaps longer than declared are a finding (from nmatt1 in AP2#338); the provider may also apply a stricter policy ceiling of its own (from giskard09 in AP2#338).
- **2026-10-23**: Section 7.4a requirement 5: a ledger-based pack names its time anchor (digest, mechanism, proof, where the anchored set is recomputed); records after the last anchor are unanchored; an anchor attests existence, not truth (from nmatt1 and Tetsurohhori in AP2#338).
- **2026-11-02**: Section 7.4a requirement 6: delivery receipts (signed request and response digests) weigh against a non-delivery or wrong-content claim only when countersigned by the buyer and matching the presented bytes; a seller-only receipt decides nothing; small-order keys are rejected (from hheskihoran in #304; vectors in inamprotocol/inam-protocol `interop/delivery`).
- **2026-10-21**: Section 4.4a `UserApproval` and `approval_digest` on complete: what the user approved is bound to the checkout, so an approved-green, ordered-black case is decided on evidence (case from the discussion in #304).

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

Finding at the time of writing: linking a dispute back to its payment is documented by seven gateways (Stripe,
Braintree, Adyen, Checkout.com, Square, PayPal and Nuvei). Carrying an agent signal on that payment is documented by two
(Stripe and Braintree). Shopify Payments links a dispute only to the order, and Elavon only by network reference
(ARN). So even where a merchant can find the disputed payment, it usually cannot show that an agent placed it, and
**no gateway documents a structured way to put that fact in front of the issuer**.

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
| Nuvei | none documented (TAP pilot announced, H2 2026 target) | Yes: Chargeback DMN `TransactionDetails.TransactionId` | none documented | | 2026-10-15; link 2026-10-18 |
| Fiserv Commerce Hub | UNKNOWN (docs not readable) | UNKNOWN | UNKNOWN | | 2026-10-15 |
| Global Payments | UNKNOWN (docs not readable) | UNKNOWN | UNKNOWN | | 2026-10-15 |
| Elavon Converge | UNKNOWN (docs not readable) | UNKNOWN | UNKNOWN | | 2026-10-15 |
| Elavon Payment Gateway | none documented (OpenAPI spec version 2026-07-21: no agentic, Agent Pay, Intelligent Commerce or Trusted Agent terms) | Network references only: `GET /disputes/{disputeId}/transaction` returns `acquirerReferenceNumber`, `rocText`; no gateway transaction ID | none documented | | 2026-10-15; link 2026-10-16 |
| NMI | none documented | Unclear: `chargeback.batch.complete` webhook carries `chargebacks[].id`; docs do not say it is the original transaction ID | none documented | | 2026-10-15; link 2026-10-16 |
| Authorize.net | none documented | none documented (only eCheck batch `chargebackCount`) | none documented | | 2026-10-15; link 2026-10-16 |
| Helcim | none documented | none documented (chargebacks are dashboard only; no dispute API in devdocs) | none documented | | 2026-10-15; link 2026-10-16 |

"None documented" means the vendor's public docs, API reference and dispute guides were read and say nothing; it is not a claim that no such capability exists. UNKNOWN means the docs could not be read. Neither means NO.

#### Sources

Pages read on 2026-10-15 for the agent-signal and issuer-field columns (from the co-author's scorecard,
https://gist.github.com/Flyingmiata-droid/5ead7a4bc777a8dfcbfb69e4bf89e385, which also quotes each page).
Dispute-link pages were read on 2026-10-16 and 2026-10-18 (verified by @Flyingmiata-droid); Worldpay's disputes docs did
not load.

1. **Stripe**: https://docs.stripe.com/api/payment_intents/object?api-version=2026-09-30.preview ;
   https://docs.stripe.com/agentic-commerce/sellers/use-cases/retail ; https://docs.stripe.com/api/disputes/object
2. **Braintree**: https://developer.paypal.com/agent-ready/agentic-commerce-protocol ;
   https://developer.paypal.com/braintree/docs/reference/response/transaction ;
   https://developer.paypal.com/braintree/docs/reference/response/dispute
3. **Adyen**: https://docs.adyen.com/online-payments/agentic-commerce/merchant/agentic-cart-api-integration ;
   https://docs.adyen.com/online-payments/agentic-commerce/merchant/google-agentic-commerce ;
   dispute link (`originalReference`): https://docs.adyen.com/risk-management/disputes-api/dispute-notifications
4. **Worldpay**: https://docs.worldpay.com/access/products/payments/enable-features/acp-delegate-token ;
   https://docs.worldpay.com/access/products/sessions/openapi/delegate-payment/delegatepayment.md (disputes doc did not load)
5. **Checkout.com**: https://www.checkout.com/docs/payments/accept-payments/accept-a-payment-via-agentic-commerce/accept-a-payment-via-chatgpt ;
   dispute link: https://www.checkout.com/docs/payments/process-disputes/disputes-api ;
   https://www.checkout.com/docs/developer-resources/webhooks/webhook-event-types/dispute_received ;
   blog cited in the row: https://www.checkout.com/blog/how-checkout-is-thinking-about-agentic-commerce
6. **Shopify Payments**: https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts ;
   https://community.shopify.dev/t/ai-agent-initiated-orders-api/29140 ;
   dispute link (order only): https://shopify.dev/docs/api/admin-graphql/latest/objects/ShopifyPaymentsDispute
7. **Square**: https://developer.squareup.com/reference/square/objects/OrderSource ; https://squareup.com/us/en/ai/agentic-commerce ;
   dispute link: https://developer.squareup.com/reference/square/objects/DisputedPayment
8. **PayPal (wallet, Orders v2)**: https://developer.paypal.com/api/orders/v2/schema.json ; https://paypal.ai/agent-ready ;
   dispute link: https://developer.paypal.com/api/customer-disputes/v1/schema.yaml
9. **Cybersource**: https://developer.cas.cybersource.com/docs/cybs/en-us/visa-agentic-platform/developer/all/rest/intelligent-commerce.html ;
   dispute link: https://developer.cybersource.com/library/documentation/dev_guides/reporting_and_reconciliation/Reporting_User/html/oxy_ex-1/topics/c_Fields_in_the_Chargeback_Report.html
10. **Nuvei**: https://docs.nuvei.com/api/main/indexMain_v1_0.html ;
    https://www.nuvei.com/posts/nuvei-completes-first-party-in-agent-payment-with-visa-unveils-merchant-led-agentic-payments-strategy ;
    dispute link (Chargeback DMN, `TransactionDetails.TransactionId`): https://docs.nuvei.com/documentation/integration/webhooks/control-panel/ ;
    https://docs.nuvei.com/documentation/control-panel-docs/risk/chargebacks-report/
11. **Fiserv Commerce Hub**: developer.fiserv.com and developer.cardpointe.com searched; Commerce Hub docs did not render.
12. **Global Payments**: https://www.globalpayments.com/agentic-commerce (developer portal did not render)
13. **Elavon Converge**: docs did not render.
14. **Elavon Payment Gateway**: https://developer.elavon.com/products/elavon-payment-gateway/v1/api-reference (OpenAPI 2026-07-21)
15. **NMI**: https://docs.nmi.com/docs/mcp (only agent-named item) ;
    dispute link: https://docs.nmi.com/reference/chargeback-events
16. **Authorize.net**: https://developer.authorize.net/api/reference/index.html
17. **Helcim**: https://devdocs.helcim.com/reference/purchase

### What would close the gap (informative)
1. A structured agent indicator in the network dispute evidence schema (for example alongside existing compelling-evidence
   data elements).
2. Until then, ATDRP recommends attaching the signed mandate and receipts as file evidence and stating the
   agent-initiated nature in the free-text field.
