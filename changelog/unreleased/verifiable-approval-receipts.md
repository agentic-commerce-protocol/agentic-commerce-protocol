## Verifiable Approval Receipts (VAR/1) — two-field reference (SEP #329)

Adds `receipt_id` and `profile` as optional reference fields pointing from an
order or checkout receipt to independently verifiable evidence, plus the SEP
document that defines the VAR/1 profile, the CG-OUT/1 outcome vocabulary, the
two anchor composition modes, and the four mechanisms that make a reference
field usable in practice: resolution, key trust, consumption and the decision
table.

### Changes

- **`receipt_id`** (optional, string) — opaque identifier for evidence held
  outside the message
- **`profile`** (optional, string) — versioned name of the profile that defines
  how to fetch and verify that evidence (e.g. `"VAR/1"`)
- No existing field, enum, endpoint or status changes. No JSON schema change is
  proposed: the entire ACP surface here is two optional strings.

### Profile mechanisms referenced by the SEP

- **Resolution (CG-REF/1)** — `receipt_id` to checked bytes: content-addressed
  ids, registry entries and derived well-known locators, with `resolved`,
  `absent`, `unresolvable` and `tampered` kept distinct. A name with no
  checkable expectation is `unresolvable`, never `resolved`.
- **Key trust (CG-KEYS/1)** — pinned roots, signed rotation chains with an
  overlap window, and time-aware revocation that separates a retirement from a
  compromise. An unknown key is `NOT_CHECKED`, not forged.
- **Single use (CG-SPEND/1)** — a signed, append-only spend log guarded by an
  OS lock, plus a `conflict` state when two systems record the same approval
  under different nonces.
- **Decision mapping (CG-DECIDE/1)** — four authorisation decisions instead of
  two; only a failed check may decline, and missing evidence is an allow that
  carries `unverified: true`.

### Files Updated

- `docs/sep-verifiable-approval-receipts.md`

### Reference

- Issue: #329
- Pre-proposal discussion: #328
- Reference implementation: https://github.com/coreguard-global/CoreGuard
