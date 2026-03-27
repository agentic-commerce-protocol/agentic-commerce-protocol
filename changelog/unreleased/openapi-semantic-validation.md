## OpenAPI semantic validation

Adds machine validation of every `openapi.*.yaml` spec using `@apidevtools/swagger-parser`, which resolves `$ref` and applies OpenAPI structural rules beyond YAML parsing and the existing `openapi` / `info` / `paths` checks in `validate-consistency.js`.

### Changes

- New script `scripts/validate-openapi.js` covering the same version directories as the consistency validator.
- `pnpm run validate:openapi` runs the new script; `pnpm run validate:all` runs consistency validation then OpenAPI semantic validation.
- Documented behavior in `scripts/README.md`.

### Files Updated

- `package.json`
- `pnpm-lock.yaml`
- `scripts/validate-openapi.js`
- `scripts/README.md`

### Reference

- PR: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/pull/202
