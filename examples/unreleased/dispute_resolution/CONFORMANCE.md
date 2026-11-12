# Conformance reports

Implementations that have reported results against `conformance_cases.json`, from their own public reports. Each row
states what the report states. Both rows below were also rerun with the runner in this repository on 2026-11-11, with
the same results.

| Implementation | Pinned at | Written against | Case file (sha256) | Result reported | Independent of the case author | Reported on | Report |
|---|---|---|---|---|---|---|---|
| Cold-read reader (Tetsurohhori) | sha256 `b519d178…` | RFC at `089d8f9` | `284db2ec…` (`7cab286`) | 33 of 33 | no (same author) | 2026-11-11 | agentic-commerce-protocol#316, comment 6809800426 |
| Cold-read reader, earlier version (Tetsurohhori) | sha256 `2a5f878e…` | RFC at `db04871` | `284db2ec…` (`7cab286`) | 27 of 33; differs on E1, E2, E4-E7 | no (same author) | 2026-11-11 | agentic-commerce-protocol#316, comment 6809800426 |

The cases come from a cold read of the RFC published under CC0 (aos-standard/catalog, `docs/runs/acp-dispute-cold/ddc2871/`).
A row whose implementation has the same author as the cases shows that the runner and the cases agree with each other
and that the cases separate the two versions of the text, not that the expectations are right. A run from an
implementation written by someone else is the row that tests the expectations.

## Reporting a run

1. Write a provider: a command that reads one case `input` as JSON on stdin and prints one JSON object with the keys
   the cases' `expect` use (`eligible`, `not_eligible`, `approval_bound`, `per_line`, and `det_ok` / `det_problems`
   when the input has a determination). Extra keys are ignored.
2. If your implementation does not cover what a case tests, print `{"not_evaluable": "<reason>"}` for it rather
   than a guess. The case is reported as not evaluable with your reason and does not count as agreeing.
3. Run `DISPUTE_PROVIDER_CMD="<your command>" node scripts/run-dispute-conformance.js` and keep the last line, which
   names the case file by its sha256.
4. Post a report that names:
   - the implementation and the exact version: a commit, or a release with its sha256;
   - the RFC commit it was written against, and whether its author also wrote or edited the cases;
   - the runner's last line, with the not-evaluable reasons and any differing cases;
   - the date of the run.

A row is added for a report that names all four. A result that differs from the cases is listed as it was reported;
whether the case or the implementation is wrong is settled in the report's thread, not by removing the row.
