## Detect property drift between JSON Schema and OpenAPI

Added validation that detects property drift between JSON Schema and OpenAPI definitions while tracking existing known mismatches explicitly.

The JSON Schema and OpenAPI artifacts are published for the same version, and implementers generate clients from either one. A property declared in one artifact but not the other is accepted by one and rejected by the other, because the OpenAPI schemas set `additionalProperties: false`. `scripts/validate-consistency.js` listed this consistency check first but did not implement it, so this class of drift passed validation.

### Changes

- **New validation**: compares declared property names for same-named schemas in JSON Schema `$defs` and OpenAPI `components.schemas`, for every version and spec that publishes both artifacts. Both drift directions are detected. Errors name the version, spec, schema, property, direction and both file paths.
- **Conservative comparison**: pairs are compared only when both sides are plain property-bearing objects. Pairs using `allOf`, `oneOf`, `anyOf`, `not`, `if`/`then`/`else`, `$ref`, `patternProperties` or `discriminator`, or declaring no properties, are skipped because the declared `properties` map does not describe the accepted object on its own.
- **Known-drift baseline**: `scripts/known-property-drift.txt` lists pre-existing mismatches, each with a tracking issue. Listed drift is reported as known and does not fail validation. Unlisted drift fails. A listed entry that no longer matches any detected drift also fails, so the file shrinks as schemas are reconciled rather than accumulating stale entries.
- **Regression tests**: `scripts/test-validate-consistency.js`, run with `pnpm run test:consistency`. Uses `node:assert` only; no new dependency.

### Files Updated

- `scripts/validate-consistency.js`
- `scripts/known-property-drift.txt`
- `scripts/test-validate-consistency.js`
- `scripts/README.md`
- `package.json`

### Reference

- Issue: #297
