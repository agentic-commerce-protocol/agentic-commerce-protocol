# HOTEL ORDER STATE MACHINE (ACP/UCP-aligned)

This document describes the lifecycle states and allowed transitions for **Hotel Order** objects (contractual reservations).

## States (high-level)

- `pending` — Execution initiated, awaiting supplier confirmation (optional; some flows return confirmed immediately)
- `confirmed` — Reservation confirmed; contractual outcome established
- `modified` — Reservation modified (dates/occupancy/room) and reconfirmed
- `cancelled` — Reservation cancelled (subject to policy)
- `refunded` — Full refund issued (prepaid bookings)
- `partially_refunded` — Partial refund issued (e.g., 1 night refunded)
- `no_show` — Guest did not arrive; no-show policy applied
- `failed` — Checkout/booking attempt failed (no contract created)

## Core transitions

### Execution
- `pending` → `confirmed`
- `pending` → `failed`

### Modification (capability-dependent)
- `confirmed` → `modified`
- `modified` → `modified` (multiple modifications)

### Cancellation
- `confirmed` → `cancelled`
- `modified` → `cancelled`

### Refunds (prepaid only)
- `cancelled` → `refunded`
- `cancelled` → `partially_refunded`
- `confirmed` → `refunded` (rare; goodwill / exception)
- `confirmed` → `partially_refunded` (exception handling)

### No-show
- `confirmed` → `no_show`
- `modified` → `no_show`

## Notes / Governance guidance

1. **Policy enforcement**: Transitions to `cancelled`/`refunded` must respect `cancellation_deadline`, `refund_policy`, and `no_show_policy` captured in the Order.
2. **Idempotency**: All state-changing operations should be idempotent using `event_id` / `correlation_id`.
3. **Event emission**: Each transition should emit a corresponding webhook event:
   - `order.confirmed`, `order.modified`, `order.cancelled`, `order.refunded`, `order.partially_refunded`, `order.no_show`, `order.failed`
4. **Revalidation**: If modification requires repricing, treat it as a new quote + confirm flow, but preserve the same `order_id` unless the supplier forces a new contract.

## ASCII transition map (simplified)

```
pending  --> confirmed --> modified
   |          |   \        |
   v          v    \       v
 failed     cancelled --> refunded / partially_refunded

confirmed / modified --> no_show
```
