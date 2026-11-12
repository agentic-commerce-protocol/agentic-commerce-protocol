# Conformance reports

Implementations that have reported results against `conformance_cases.json`, from their own public reports. Each row
states what the report states; this repository has not run these implementations.

To produce a report, run your implementation through the runner and post the last line, which names the case file by
its sha256:

```
DISPUTE_PROVIDER_CMD="python3 my_provider.py" node scripts/run-dispute-conformance.js
```

| Implementation | Written against | Case file (sha256) | Result reported | Report |
|---|---|---|---|---|
| Cold-read reader (Tetsurohhori) | RFC at `089d8f9` | `284db2ec…` (`7cab286`) | 33 of 33 | agentic-commerce-protocol#316, comment 6809800426 |
| Cold-read reader, earlier version (Tetsurohhori) | RFC at `db04871` | `284db2ec…` (`7cab286`) | 27 of 33; differs on E1, E2, E4-E7 | agentic-commerce-protocol#316, comment 6809800426 |

The case expectations and the readers above have the same author, so these rows show that the cases separate the two
versions of the text, not that the expectations are right. A row is added when an implementer posts a report naming the
case file and the result.
