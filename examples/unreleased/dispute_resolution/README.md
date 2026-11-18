# dispute_resolution conformance cases

`conformance_cases.json` holds 33 cases for the dispute_resolution extension (`rfcs/rfc.dispute_resolution.md`).
Each case is an input a provider receives and what a provider following the RFC decides. They are for implementers to
run their own provider logic against. `scripts/validate-consistency.js` checks that every input is valid under
`schema.dispute_resolution.json`. It does not check the decisions, which need an implementation.

## Fields

`input.record` is a `DisputeRecord`. Determination checks also carry `input.determination`, a `DisputeDetermination`.
U3 also carries `input.opened_at`.

`expect` has two parts. A case uses one of them, or both.

**Eligibility and the decision** (Sections 4.4, 4.4a, 7.4, 7.5):

| Field | Meaning |
| --- | --- |
| `eligible` | whether the record can be decided (Sections 4.4 and 7.5) |
| `not_eligible` | when not: `authorization_chain_broken`, `receipt_status`, `outside_window` or `line_amount_missing` |
| `approval_bound` | for records with `user_approval`: whether it passes both checks of Section 4.4a |
| `per_line[].outcome`, `.amount` | `uphold` or `overturn`, and the amount overturned (0 when upheld), per disputed line |
| `per_line[].rule` | the rule of Section 7.4 that decides the line: `1_moot`, `2_over_mandate` / `2_after_exp`, `3_canceled` / `3_unfulfilled`, `4_intent`, `5_default` |
| `per_line[].finding` | `agent_platform` when rule 4 records a finding against the agent platform, otherwise null |

**Checks on a determination** (Sections 4.5, 7.2, 7.3, 7.7):

| Field | Meaning |
| --- | --- |
| `det_ok` | whether the determination is consistent with the record and the RFC |
| `det_problems` | what is wrong with it, for example `missing:opened_at`, `prohibited_not_screened`, `factor_not_permitted:<name>`, `factors_absent:<names>`, `signer_incomplete`, `outcome_differs:<line>`, `fee_paid_by_differs` |

The rule names and problem codes are labels for comparing results, not protocol values. An implementation can map
its own reasons to them.

E5, E6 and T3 are determinations that are invalid under the schema on purpose. The validator skips the
determination of any case whose `expect.det_ok` is `false`.

## Readings

Eight cases depend on a part of the RFC text that was added or made explicit during review. At the RFC commit named
in `conformance_cases.json`, each one is stated in the text (`readings_stated`). If a later edit changes one of those
sentences, the cases listed with it are the ones to recheck.

## Source

These cases come from an independent cold run of this RFC by a reader written from the text alone, scored 35/35 at
`ddc2871` (record: https://github.com/aos-standard/catalog/tree/b04d9ad/docs/runs/acp-dispute-cold/ddc2871). Two of
those 35 are left out here (U1 and U2, the example pairs as published at earlier commits). The inputs and
expectations are copied as they are, from aos-standard/catalog at `3886bd0` (`docs/runs/acp-dispute-cold/handover-94a71e9/`). CC0-1.0.
