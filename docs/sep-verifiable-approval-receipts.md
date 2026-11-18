# SEP: Verifiable Approval Receipts (VAR/1) — a two-field reference from an order to independently verifiable evidence

## SEP Metadata

- **SEP Number**: #329
- **Author(s)**: EslaM-X (CoreGuard maintainers)
- **Status**: `proposal` (awaiting sponsor)
- **Type**: [x] Major Change [ ] Process Change
- **Related Issues/RFCs**: pre-proposal Discussion #328 (filed first per the SEP guidelines); issue #329 (this SEP); `rfcs/rfc.orders.md`; AP2 mandate/receipt artifacts (`checkout_mandate`, `payment_mandate`, `checkout_receipt`, `payment_receipt`) — VAR/1 sits **beside** those artifacts as a verification profile, not in place of them
- **Labels note**: non-maintainers cannot apply labels — a maintainer may wish to add `SEP` / `proposal`

---

## Abstract

This SEP proposes **one additive reference**, not a new transaction schema: an order or checkout receipt MAY carry `receipt_id` (a string) and `profile` (a string such as `"VAR/1"`), pointing at evidence a third party can verify offline. Everything the profile versions — the canonical intent, the drift comparison, the reject vocabulary, the anchor composition rule — is defined by the profile document, on the profile's own clock, so ACP does not inherit a schema it must maintain for an opt-in artifact.

The problem being solved is narrow and real: a signed mandate proves the parties *agreed* on an intent, and a signed receipt proves a payment *happened*. Neither is, by itself, portable evidence that the executed order **matched field-by-field** what the user approved. That binding currently lives inside each platform's private logs. The two fields above let a wallet, merchant, risk provider or auditor name that evidence and fetch it, without changing a single existing field, enum or endpoint.

The profile itself (VAR/1) is an opt-in receipt format: canonical-JSON digests, an Ed25519 signature over the approval object, a fail-closed comparison of executed fields against approved fields, and a frozen, versioned reject vocabulary. It carries no payment credentials and no probabilistic scores. A companion outcome vocabulary (`CG-OUT/1`, five outcomes, two of which may block) keeps four different facts apart that tend to collapse into one green check: verified, absent, not checked, and unresolvable.

---

## Motivation

Agent-initiated purchasing has a strong authorization story and a weak evidence story. The authorization is recorded; the conformance between approval and execution is not portable. Several real failure classes live exactly in that gap:

- a **recipient swap** — the order executes against a different beneficiary than approved;
- **value escalation** — shipping, tax or fees quietly inflated between approval and execution;
- **item mutation** — cart contents changed after approval;
- **credential substitution** — a different instrument at execution time;
- **expired or reused authorization** — the validity window lapsed, or the approval was consumed twice;
- **malformed execution** — a record that no signature alone reveals as wrong.

Every party that wants assurance about those cases today must either trust a platform's private logs or build a bespoke verifier. That is the status quo this SEP exists to close, and it closes it without asking ACP to adopt anyone's schema.

Two design conversations shaped the proposal, and both are recorded in the thread rather than smoothed over:

1. **AER-1 (agent execution receipts).** The id of an AER-1 receipt is a label outside the committed payload; the commitment does not cover it. So a verifier binds the id only against an external expectation or a resolution whose record agrees on the committed digest — with neither, the id is *unverified*, not matched. Our parser implements exactly that, and runs the published corpus to prove it (see Conformance).
2. **Anchor composition.** An anchor says where a copy of a record was seen. AER-1 reports the record layer and the anchor layer separately; our default composes the anchor outcome into the headline. Neither is a disagreement about the receipt: under composition a second anchor that resolves later flips the composed verdict, and under layering the record verdict never moves. The resolution adopted here is that *the consumer's mode is part of the evidence*: a receipt states whether its outcome is composed or layered, so an archival reader and a commerce reader can both be right about the same bytes.

---

## Specification

### 1. The reference (this SEP's entire schema surface)

Two optional fields, permitted anywhere an executed-order or receipt artifact is already carried:

| Field | Type | Meaning |
|---|---|---|
| `receipt_id` | string | An identifier for evidence held outside the message. Opaque to ACP. |
| `profile` | string | The profile that defines how to fetch and verify that evidence (e.g. `"VAR/1"`). Opaque to ACP beyond being a versioned name. |

Rules:

- Both fields are **optional and additive**. No existing field, enum, endpoint or status changes shape or meaning.
- When `profile` is present, `receipt_id` MUST be present. A profile without a reference is not a reference.
- ACP does not define the profile's contents, its versioning, or its verifier. A profile is identified by name and version; its document is authoritative for its own semantics.
- An unknown `profile` value MUST be treated as *evidence not checked*, never as a failed verification. This is the same rule as an unimplemented record version: a verifier that never judged a record may not convict it.

### 2. The VAR/1 profile (normative pointer, not normative here)

VAR/1 is one profile that fits the reference above. Its document lives in the reference implementation (`docs/AGENT-COMMERCE-SECURITY-SPEC-V1.md` in CoreGuard) and defines:

- **Canonical form** — JSON with lexicographically sorted keys, UTF-8, no insignificant whitespace; `intent_digest = sha256(canonical(intent))`.
- **Signature** — Ed25519 over the intent digest, with the issuer's `keyId` and algorithm named in the receipt.
- **Fail-closed comparison** — every executed field is compared against the approved intent; any mismatch rejects with a named code from a frozen, versioned vocabulary. A verifier error is itself a code, never an exception that leaks a pass.
- **Injected clock** — expiry is evaluated against a caller-supplied `nowSeconds`, so verification is deterministic and reproducible.
- **No credentials, no scores** — receipts bind commerce intent, not instruments; risk annotations are deterministic named classes, never probabilistic numbers.

### 3. Outcome vocabulary (CG-OUT/1)

Five outcomes, and the rule that keeps them from collapsing:

| Outcome | Means | May block |
|---|---|---|
| `VERIFIED` | the artifact was checked, and the check passed | no |
| `VERIFICATION_FAILED` | the artifact was checked, and the check failed | **yes** |
| `ABSENT` | no artifact was presented. Silence. | no |
| `NOT_CHECKED` | an artifact was presented and this verifier did not judge it — the reason and any version are named | no |
| `UNRESOLVABLE_RECORD` | the artifact was presented and the evidence needed to judge it could not be resolved | **yes** |

Two invariants are normative because they are the ones implementations get wrong: `ABSENT` and `NOT_CHECKED` MUST NOT be reported as blocks, and a supported-version check that does not recognise a version MUST report `NOT_CHECKED` with the version named.

### 4. Anchor composition (the part that needs to be stated, not assumed)

A receipt MAY be anchored. Anchoring never upgrades a record, and an unresolvable anchor is not a failed record. A profile that carries an anchor outcome MUST declare one of two composition modes:

- **`composed`** — the anchor outcome participates in the headline. A verified record whose only anchor cannot be resolved reads `UNRESOLVABLE_RECORD` and may block. Best for a commerce consumer that needs one answer now.
- **`layered`** — the headline describes the record alone; the anchor layer reports its own fact, including a rejection. Best for a record that must outlive any single anchor.

The property that distinguishes them, stated so an implementer can test it: in `layered` mode, a second anchor that resolves later changes the anchor block and never the record outcome; in `composed` mode the same event legitimately flips the headline. Both are correct answers to different questions, which is why the mode travels with the evidence instead of being inferred by the reader.

### 5. Conformance

A profile SHOULD publish machine-readable vectors and a runner. Two independent conformance suites exist today:

- **AER-1 corpus** (published by the AER-1 author, kit v1.5.7): 72 files, 143 vectors, one `evaluated_set_digest`. The reference implementation vendors the whole set and reproduces that digest from the bytes on disk; it judges the 6 id-binding vectors end to end and reports the remaining 137 as `NOT_CHECKED` with their family named. Integrity is a whole-corpus property; semantics is claimed only where implemented.
- **VAR/1 attack battery** (CoreGuard): named must-fail vectors for recipient substitution, value escalation, item mutation, credential substitution, expiry, replay and receipt tamper — every leg fails closed with a code, and the one gap (cross-session consumption anchoring beyond a host) is documented rather than hidden.

---

## Rationale

**Why two fields instead of a schema.** A verification profile changes on its own clock: a new reject code, a new anchor kind, a new canonical rule. Putting that surface into ACP's schemas would couple every profile revision to this repository's release process, for an artifact most participants will never emit. Two opaque fields give interoperability — a reader can always find the evidence — without transferring ownership of the vocabulary.

**Why a string profile rather than an enum.** An enum in ACP would require ACP to bless every profile. A versioned name lets independent profiles exist and lets a verifier say *not checked* for one it does not implement, which is the honest answer and the one that keeps the ecosystem from fragmenting into "unknown = broken".

**Why `ABSENT` and `NOT_CHECKED` must not block.** Most false declines in agent commerce are the system treating missing evidence as bad evidence. A payment that had no receipt is not a payment that failed verification, and a verifier that never looked is not a witness. Encoding that distinction in the vocabulary is cheaper than teaching every integrator to re-derive it.

**Why the composition mode is explicit.** The AER-1 exchange made the disagreement concrete: our composition can flip a headline when a second anchor resolves later, while layered reporting cannot. Both behaviours are wanted by different consumers. Making the mode part of the evidence turns a recurring review argument into a field a test can assert.

**Alternatives considered.** (a) Extending mandate schemas with execution echoes — rejected: couples the profile to specific mandate versions and breaks additivity. (b) Leaving the check inside each platform — the status quo. (c) A probabilistic risk score field — rejected on auditability grounds; named classes are reproducible and contestable. (d) A full receipt schema in ACP — rejected for the clock-ownership reason above.

---

## Backward Compatibility

Purely additive and opt-in:

- No existing field changes shape, meaning or cardinality; no endpoint or status is added.
- Participants that never emit receipts behave exactly as today.
- A reader that does not implement a profile reports `NOT_CHECKED` and continues; it does not reject the message.
- Receipts contain no card data. The reference implementation's demos use placeholder credentials only.

---

## Reference Implementation

CoreGuard — an independent, open-source implementation (https://github.com/coreguard-global/CoreGuard), MIT:

- Profile document: `docs/AGENT-COMMERCE-SECURITY-SPEC-V1.md`
- Profile modules: `packages/agent-commerce/` — consent record (CGCR/1), exact-execution firewall, AGR/1 engine, `outcomes.mjs` (CG-OUT/1), `identity.mjs` (CG-ID/1: a record's name kept apart from its bytes), `composition.mjs` (CG-COMPOSE/1: the two anchor modes above)
- AER-1 parser and corpus runner: `packages/agent-commerce/aer1.mjs`, `scripts/aer1-corpus.mjs` — the whole published corpus vendored, per-file digests verified, `evaluated_set_digest` reproduced from disk, one family judged end to end
- Anchor service: `packages/agent-commerce/anchor.mjs`, `scripts/anchor.mjs` — Ed25519 attestations that verify offline and carry their own public key, an append-only hash-chained log, one Merkle root, and a chain adapter that prepares a 32-byte memo and refuses `mainnet` by name; no broadcast path exists in the module
- Attack battery: `test/integrations/agent-commerce-attack-battery.test.mjs`
- Demo: `node examples/agent-commerce-security-suite/run.mjs` (deterministic; exit 0 only on the exact arc)

Honest boundaries, stated the same way here as in the repository: no production deployment, no external customer; the on-chain anchor leg is prepare-only and owner-gated; `VERIFIED` is a claim about evidence, not about safety.

---

## Security Implications

- **What this buys**: the approval↔execution binding becomes portable, independently checkable and tamper-evident; risk systems get a deterministic evidence input instead of a claim.
- **What it does not buy**: it is not a fraud model and not a security audit. A valid receipt proves the executed order matched the approved intent at the recorded time. Nothing more.
- **Known gaps**: cross-session consumption anchoring beyond a host is not built (same-host, file-backed single-use is); key rotation and revocation are the issuer's responsibility and would need profile treatment; a signature proves issuer integrity, not merchant honesty.
- **Privacy**: no payment credentials in receipts; identifiers in the two reference fields are opaque to ACP.

---

## Pre-Submission Checklist

- [x] GitHub Issue created (#329); the `SEP`/`proposal` labels cannot be applied by a non-maintainer
- [x] Discussed first per the SEP guidelines — Discussion #328
- [x] Changelog entry under `changelog/unreleased/`
- [x] Reference implementation linked and runnable
- [ ] JSON schema PR under `spec/unreleased/json-schema/` — **deliberately not included**: this proposal adds two optional string fields and no structure, which is the point; a schema is only needed if the community prefers to constrain the reference fields, and that can follow sponsorship
- [ ] Sponsor sought: Founding Maintainers or TSC

---

## Additional Context

The reference implementation is maintained by an independent project (CoreGuard). No integration, endorsement or partnership with OpenAI, Stripe, Zambo, AER-1, or any payment network is claimed or implied. This SEP is a proposal seeking a sponsor and community review. All cited counts are machine-measured and reproducible from a fresh clone of the reference repository; where a number is a measurement of someone else's published artifact, the digest of that artifact is recorded with it.
