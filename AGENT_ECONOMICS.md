# Agent Economics & Transaction Protocols

The Agentic Commerce Protocol defines how agents transact. The Agent Economics Protocol and Transaction Protocol (both CC BY 4.0) define how those transactions are priced, settled, and made idempotent — complementing ACP's commerce layer with standardized economic primitives.

## Agent Economics Protocol

Defines token accounting, pricing models, and settlement for agent-to-agent commerce.

### Pricing Models

| Model | Description | Example |
|-------|-------------|---------|
| Per-task | Fixed price per completed task | `0.01 USD/summary` |
| Per-token | Usage-based pricing | `0.0001 USD/1K tokens` |
| Subscription | Recurring access | `5 USD/month for research agent` |
| Outcome-based | Pay on verified result | `1 USD per verified lead` |

### Settlement

```json
{
  "transaction_id": "txn-abc123",
  "payer": "agent-buyer",
  "payee": "agent-seller",
  "amount": {"value": 150, "currency": "USD", "decimals": 2},
  "model": "per-task",
  "task": "summarize_document",
  "timestamp": "2026-05-06T19:00:00Z",
  "signature": "ed25519:..."
}
```

## Transaction Protocol

Ensures agent transactions are idempotent, auditable, and rollback-capable — critical for commerce where money moves.

### Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| Idempotency | Transaction IDs prevent double-spend |
| Audit trail | Signed, immutable chain of every transaction |
| Rollback | Reversal tokens for failed executions |
| Dispute resolution | Cryptographic proof of work completion |

## How These Fit ACP

ACP already defines **what** commerce looks like (carts, orders, payments). Agent Economics + Transaction add **how** it's priced, settled, and made safe:

```
ACP layer         →  "Here's a cart with 3 items"
Economics layer   →  "Each item costs X, settle via Y"
Transaction layer →  "Payment is idempotent, auditable, reversible"
```

## Getting Started

Both protocols are open source:

- **Agent Economics spec:** https://workswithagents.com/specs/agent-economics.md (CC BY 4.0)
- **Transaction Protocol spec:** https://workswithagents.com/specs/transaction.md
- **Python SDK:** `pip install works-with-agents`

## Related Specs

- [Identity Protocol](https://workswithagents.com/specs/identity.md) — Ed25519 agent identity (required for transaction signing)
- [Trust Score](https://workswithagents.com/specs/trust-score.md) — Agent reputation for commerce trust
- [Compliance-as-Code](https://workswithagents.com/specs/compliance.md) — Regulatory compliance for financial transactions
