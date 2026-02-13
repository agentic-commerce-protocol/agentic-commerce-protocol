# SEP: Recurring Payment Support

**Delegate Payment API – Schema & Examples**

- **Allowance schema**: Extended `reason` enum to include `recurring` and `subscription` values. Added optional fields for billing cycles (`billing_cycle`), per-cycle amounts (`amount_per_cycle`), cycle limits (`max_cycles`), trial periods (`trial_period_days`, `trial_amount`), usage-based billing (`usage_based`), and proration (`proration_enabled`). When `reason` is `recurring` or `subscription`, `billing_cycle` and `amount_per_cycle` are required.
  - `spec/unreleased/json-schema/schema.delegate_payment.json`
- **Recurring payment example**: Added `delegate_payment_recurring_request` and `delegate_payment_recurring_response` showing a monthly subscription delegation with trial period, cycle limits, and proration.
  - `examples/unreleased/examples.delegate_payment.json`

Addresses #12
