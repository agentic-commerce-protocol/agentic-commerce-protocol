## Dispute Resolution Extension for Agent-Initiated Transactions (SEP #303)

Add the optional `dispute_resolution` extension (ATDRP): merchants and agents agree a dispute resolution provider at checkout, disputes carry the AP2 mandate and receipt artifacts and the ACP Order as evidence, and a provider determination is recorded as an `Order` adjustment of type `dispute`.

### Changes

- **New RFC**: `rfcs/rfc.dispute_resolution.md` (extension declaration, schema, policy ATDRP-0.1, open questions, Appendix C card-rail mapping)
- **New schema**: `schema.dispute_resolution.json` with `DisputeAmount`, `DisputeProviderRef`, `DisputeResolution`, `DisputeResolutionRequest`, `DisputeClaim`, `DisputeRecord`, `DisputeDeterminationLine`, `DisputeDetermination`
- **CheckoutSession**: Added optional `dispute_resolution`
- **CheckoutSessionCompleteRequest**: Added optional `dispute_resolution` (`selected_provider`)
- **Adjustment**: Added optional `dispute_determination`
- **Examples**: Added `examples.dispute_resolution.json` and three dispute examples in `examples.agentic_checkout.json`
- **Validation**: `scripts/validate-consistency.js` now validates the `dispute_resolution` examples against their schemas

### Benefits

- **Shared dispute record**: parties interoperate on one record built from artifacts the protocols already produce
- **Deterministic outcomes**: the decision rule is written so two providers given the same record reach the same outcome
- **Backward compatible**: all additions are optional; the extension is inactive unless both sides declare it and agree a provider

### Files Updated

- `rfcs/rfc.dispute_resolution.md`
- `spec/unreleased/json-schema/schema.dispute_resolution.json`
- `spec/unreleased/json-schema/schema.agentic_checkout.json`
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml`
- `examples/unreleased/examples.dispute_resolution.json`
- `examples/unreleased/examples.agentic_checkout.json`
- `scripts/validate-consistency.js`

### Reference

- Issue: #303
