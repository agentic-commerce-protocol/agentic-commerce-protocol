## Verifiable Approval Receipts (VAR/1) — two-field reference (SEP #329)

Adds `receipt_id` and `profile` as optional reference fields pointing from an
order or checkout receipt to independently verifiable evidence, plus the SEP
document that defines the VAR/1 profile, the CG-OUT/1 outcome vocabulary and the
two anchor composition modes.

### Changes

- **`receipt_id`** (optional, string) — opaque identifier for evidence held
  outside the message
- **`profile`** (optional, string) — versioned name of the profile that defines
  how to fetch and verify that evidence (e.g. `"VAR/1"`)
- No existing field, enum, endpoint or status changes. No JSON schema change is
  proposed: the entire ACP surface here is two optional strings.

### Files Updated

- `docs/sep-verifiable-approval-receipts.md`

### Reference

- Issue: #329
- Pre-proposal discussion: #328
- Reference implementation: https://github.com/coreguard-global/CoreGuard
