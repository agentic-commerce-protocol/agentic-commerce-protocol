# Scripts

This directory contains automated scripts for maintaining the Agentic Commerce Protocol specification.

## Automated Consistency Validation

This directory contains automated validation scripts that ensure consistency across JSON Schemas, OpenAPI specifications, and examples.

## What Gets Validated

### ✅ JSON Schema Syntax
- Valid JSON syntax
- Proper JSON Schema structure
- Required `$schema` field

### ✅ OpenAPI Syntax  
- Valid YAML syntax
- Proper OpenAPI 3.x structure
- Required fields (openapi, info, paths)

### ✅ Prohibited Schemas
- Enforces architectural rules for schema placement
- Extensible for custom validation rules

### ✅ Field Type Consistency
- Validates critical field types across specifications
- Ensures monetary fields use correct types
- Checks both JSON Schema and OpenAPI

### ✅ Examples Validation
- Examples validate against their corresponding JSON Schemas
- Automatic schema detection based on example naming

### ✅ JSON Schema vs OpenAPI Consistency
- Field types match between JSON Schema and OpenAPI
- Required fields are consistent
- Enum values match

## Running Locally

```bash
# Install dependencies
pnpm install

# Run all validations
pnpm run validate:all

# Run specific validations
pnpm run validate:json-schema      # JSON Schema syntax only
pnpm run validate:openapi           # OpenAPI syntax only
pnpm run validate:examples          # Examples against schemas
pnpm run validate:field-types       # Critical field types
pnpm run validate:consistency       # Full consistency check
```

## GitHub Actions Integration

Every PR automatically runs the full validation suite via `.github/workflows/validate-consistency.yml`.

The PR will:
- ✅ **Pass** if all validations succeed
- ⚠️ **Pass with warnings** if only warnings are present
- ❌ **Fail** if any errors are found

## Adding New Validations

Edit `scripts/validate-consistency.js` to add new validation rules:

```javascript
// Example: Add architectural constraints
const PROHIBITED_SCHEMAS = {
  'spec_name': ['SchemaName']
};

// Example: Add critical field validations
const CRITICAL_FIELDS = [
  'field_name', 'another_field'
];
```

## Error Categories

### Errors (Fail CI)
- Invalid JSON/YAML syntax
- Prohibited schemas in wrong files
- Critical fields with incorrect types
- Examples that don't validate against schemas

### Warnings (Don't fail CI)
- Missing optional files
- Examples without clear schema mapping
- Style inconsistencies

## Examples of What Gets Caught

✅ **Type errors**: Critical fields using incorrect types  
✅ **Missing schemas**: Schemas referenced but not defined  
✅ **Architectural violations**: Schemas in wrong specification files  
✅ **Schema mismatches**: Referenced schemas that don't exist  

## Contributing

When making changes to schemas:
1. Update JSON Schema
2. Update corresponding OpenAPI spec
3. Update examples
4. Run `pnpm run validate:all` locally
5. Fix any errors before pushing

The CI will automatically validate on PR creation.
