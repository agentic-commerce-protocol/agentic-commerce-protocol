# Enhanced Schema Validation for Documentation Completeness

**Validation Script – Added** – Comprehensive validation rules to ensure all schemas in `spec/unreleased/` have complete descriptions and examples.

## New Validations

### JSON Schema Validation

- **Field Descriptions**: All data models and fields must have descriptions. Validates recursively through properties, array items, `oneOf`/`anyOf`/`allOf`, and `additionalProperties`.
- **Model Examples**: Every data model in `$defs` must have at least one example (using `example` or `examples` field).

### OpenAPI Validation

- **Field Descriptions**: All schema fields must have descriptions. Enforced as errors to ensure API documentation completeness.
- **Schema Examples**: All top-level schemas in `components/schemas` must have examples.

### Dynamic File Discovery

- Removed hardcoded file lists (`SPECS` array)
- Added dynamic discovery: `getJsonSchemaFiles()` and `getOpenApiFiles()` functions
- Now validates ALL `schema.*.json` and `openapi.*.yaml` files in each version directory
- Automatically includes newly added schemas like `schema.discount.json` and `schema.extension.json`

## Fixed Validation Issues

### Bug Fixes

- **Amount field validation**: Fixed false positives for properties using composition patterns (`allOf`, `$ref`, etc.). The validator now skips these when checking if amount fields are integers.

### Schema Updates

Added missing descriptions and examples to `spec/unreleased/`:

- `schema.agentic_checkout.json`
- `schema.delegate_payment.json` 
- `schema.discount.json`
- `schema.extension.json`
- `openapi.agentic_checkout.yaml`
- `openapi.delegate_payment.yaml`

## Benefits

- Prevents incomplete documentation from being committed
- Ensures consistency between JSON Schema and OpenAPI specifications
- Helps developers understand data models with comprehensive examples
- Runs automatically on every commit via GitHub Actions

**Files changed**: `scripts/validate-consistency.js`, `scripts/README.md`, `spec/unreleased/json-schema/*.json`, `spec/unreleased/openapi/*.yaml`
