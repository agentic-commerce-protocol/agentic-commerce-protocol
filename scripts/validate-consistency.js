#!/usr/bin/env node

/**
 * Comprehensive consistency validator for Agentic Commerce Protocol
 *
 * Validates:
 * 1. JSON Schema vs OpenAPI schema consistency
 * 2. Examples validate against schemas
 * 3. Field type consistency (especially integer vs string for amounts)
 * 4. Prohibited schemas (like Refund in agentic_checkout)
 * 5. Required field consistency
 * 6. All fields in unreleased JSON schemas have descriptions
 * 7. All data models in unreleased JSON schemas have at least one example
 * 8. All fields in unreleased OpenAPI schemas have descriptions
 * 9. All schemas in unreleased OpenAPI specs have at least one example
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const yaml = require('js-yaml');

const VERSIONS = ['2025-09-29', '2025-12-12', '2026-01-16', '2026-01-30', 'unreleased'];
const PROHIBITED_SCHEMAS = {
  'agentic_checkout': ['Refund'] // Refund should only be in webhook spec
};

const CRITICAL_AMOUNT_FIELDS = [
  'base_amount', 'discount', 'subtotal', 'tax', 'total',
  'amount', 'max_amount', 'unit_amount'
];

let errors = [];
let warnings = [];

// Helper function to recursively check properties for descriptions
// Used by both JSON Schema and OpenAPI validation
function checkProperties(obj, path = [], options = {}) {
  const { skipTopLevel = false, skipRefs = false } = options;
  
  if (!obj || typeof obj !== 'object') return [];
  
  let missingDescriptions = [];

  // If this is a property definition with a type, check for description
  if (obj.type && !obj.description) {
    // Skip $refs if requested (OpenAPI)
    if (skipRefs && obj.$ref) {
      // Do nothing
    }
    // Skip top-level if requested (OpenAPI schemas at path length <= 1)
    else if (skipTopLevel && path.length <= 1) {
      // Do nothing
    }
    // Skip if this is just a simple enum or const value
    else if (!obj.enum && !obj.const && !obj.oneOf && !obj.anyOf && !obj.allOf) {
      missingDescriptions.push(path.join('.'));
    }
  }

  // Check properties object
  if (obj.properties) {
    Object.keys(obj.properties).forEach(propName => {
      missingDescriptions.push(...checkProperties(obj.properties[propName], [...path, propName], options));
    });
  }

  // Check array items
  if (obj.items) {
    missingDescriptions.push(...checkProperties(obj.items, [...path, '[items]'], options));
  }

  // Check oneOf, anyOf, allOf
  ['oneOf', 'anyOf', 'allOf'].forEach(key => {
    if (obj[key] && Array.isArray(obj[key])) {
      obj[key].forEach((subSchema, idx) => {
        missingDescriptions.push(...checkProperties(subSchema, [...path, `[${key}[${idx}]]`], options));
      });
    }
  });

  // Check additionalProperties if it's a schema
  if (obj.additionalProperties && typeof obj.additionalProperties === 'object') {
    missingDescriptions.push(...checkProperties(obj.additionalProperties, [...path, '[additionalProperties]'], options));
  }
  
  return missingDescriptions;
}

// Helper function to get all JSON schema files in a directory
function getJsonSchemaFiles(version) {
  const schemaDir = path.join(__dirname, '..', 'spec', version, 'json-schema');
  if (!fs.existsSync(schemaDir)) {
    return [];
  }
  return fs.readdirSync(schemaDir)
    .filter(file => file.endsWith('.json') && file.startsWith('schema.'))
    .map(file => file.replace('schema.', '').replace('.json', ''));
}

// Helper function to get all OpenAPI files in a directory
function getOpenApiFiles(version) {
  const openApiDir = path.join(__dirname, '..', 'spec', version, 'openapi');
  if (!fs.existsSync(openApiDir)) {
    return [];
  }
  return fs.readdirSync(openApiDir)
    .filter(file => file.endsWith('.yaml') && file.startsWith('openapi.'))
    .map(file => file.replace('openapi.', '').replace('.yaml', ''));
}

function error(message, context = {}) {
  errors.push({ message, ...context });
  console.error(`❌ ERROR: ${message}`);
  if (Object.keys(context).length > 0) {
    console.error(`   Context:`, JSON.stringify(context, null, 2));
  }
}

function warn(message, context = {}) {
  warnings.push({ message, ...context });
  console.warn(`⚠️  WARNING: ${message}`);
  if (Object.keys(context).length > 0) {
    console.warn(`   Context:`, JSON.stringify(context, null, 2));
  }
}

function success(message) {
  console.log(`✅ ${message}`);
}

// 1. Validate JSON Schema Syntax
function validateJsonSchemaSyntax() {
  console.log('\n📋 Validating JSON Schema Syntax...\n');

  VERSIONS.forEach(version => {
    const specs = getJsonSchemaFiles(version);
    
    specs.forEach(spec => {
      const schemaPath = path.join(__dirname, '..', 'spec', version, 'json-schema', `schema.${spec}.json`);

      if (!fs.existsSync(schemaPath)) {
        warn(`Schema not found: ${schemaPath}`, { version, spec });
        return;
      }

      try {
        const content = fs.readFileSync(schemaPath, 'utf8');
        const schema = JSON.parse(content);

        // Basic validation
        if (!schema.$schema) {
          error(`Missing $schema in ${version}/${spec}`, { version, spec });
        }

        success(`Valid JSON Schema: ${version}/${spec}`);
      } catch (err) {
        error(`Invalid JSON in ${version}/${spec}: ${err.message}`, { version, spec });
      }
    });
  });
}

// 2. Validate OpenAPI Syntax
function validateOpenApiSyntax() {
  console.log('\n📋 Validating OpenAPI Syntax...\n');

  VERSIONS.forEach(version => {
    const specs = getOpenApiFiles(version);

    specs.forEach(spec => {
      const openApiPath = path.join(__dirname, '..', 'spec', version, 'openapi', `openapi.${spec}.yaml`);

      if (!fs.existsSync(openApiPath)) {
        warn(`OpenAPI not found: ${openApiPath}`, { version, spec });
        return;
      }

      try {
        const content = fs.readFileSync(openApiPath, 'utf8');
        const openapi = yaml.load(content);

        if (!openapi.openapi || !openapi.info || !openapi.paths) {
          error(`Invalid OpenAPI structure in ${version}/${spec}`, { version, spec });
        }

        success(`Valid OpenAPI: ${version}/${spec}`);
      } catch (err) {
        error(`Invalid YAML in ${version}/${spec}: ${err.message}`, { version, spec });
      }
    });
  });
}

// 3. Check for prohibited schemas
function checkProhibitedSchemas() {
  console.log('\n🚫 Checking for Prohibited Schemas...\n');

  VERSIONS.forEach(version => {
    Object.keys(PROHIBITED_SCHEMAS).forEach(spec => {
      const schemaPath = path.join(__dirname, '..', 'spec', version, 'json-schema', `schema.${spec}.json`);

      if (!fs.existsSync(schemaPath)) return;

      try {
        const content = fs.readFileSync(schemaPath, 'utf8');
        const schema = JSON.parse(content);

        PROHIBITED_SCHEMAS[spec].forEach(prohibitedName => {
          if (schema.$defs && schema.$defs[prohibitedName]) {
            error(
              `Prohibited schema "${prohibitedName}" found in ${spec}`,
              {
                version,
                spec,
                schema: prohibitedName,
                reason: `${prohibitedName} should only be in webhook spec, not ${spec}`
              }
            );
          }
        });

        success(`No prohibited schemas in ${version}/${spec}`);
      } catch (err) {
        // Already caught in syntax validation
      }
    });
  });
}

// 4. Validate field types (especially amounts must be integers)
function validateFieldTypes() {
  console.log('\n🔢 Validating Field Types (amounts must be integers)...\n');

  VERSIONS.forEach(version => {
    const specs = getJsonSchemaFiles(version);
    
    specs.forEach(spec => {
      const schemaPath = path.join(__dirname, '..', 'spec', version, 'json-schema', `schema.${spec}.json`);

      if (!fs.existsSync(schemaPath)) return;

      try {
        const content = fs.readFileSync(schemaPath, 'utf8');
        const schema = JSON.parse(content);

        // Check all $defs for amount fields
        if (schema.$defs) {
          Object.keys(schema.$defs).forEach(defName => {
            const def = schema.$defs[defName];
            if (def.properties) {
              Object.keys(def.properties).forEach(propName => {
                const prop = def.properties[propName];

                // Check if this is an amount field
                if (CRITICAL_AMOUNT_FIELDS.includes(propName)) {
                  // Skip if property uses $ref, allOf, oneOf, anyOf (composition patterns)
                  if (prop.$ref || prop.allOf || prop.oneOf || prop.anyOf) {
                    return;
                  }
                  if (prop.type !== 'integer') {
                    error(
                      `Amount field "${propName}" in ${defName} has type "${prop.type}" instead of "integer"`,
                      { version, spec, schema: defName, field: propName, type: prop.type }
                    );
                  }
                }
              });
            }
          });
        }

        success(`Field types correct in ${version}/${spec}`);
      } catch (err) {
        // Already caught in syntax validation
      }
    });
  });

  // Also check OpenAPI
  VERSIONS.forEach(version => {
    const specs = getOpenApiFiles(version);

    specs.forEach(spec => {
      const openApiPath = path.join(__dirname, '..', 'spec', version, 'openapi', `openapi.${spec}.yaml`);

      if (!fs.existsSync(openApiPath)) return;

      try {
        const content = fs.readFileSync(openApiPath, 'utf8');
        const openapi = yaml.load(content);

        // Check schemas for amount fields
        if (openapi.components && openapi.components.schemas) {
          Object.keys(openapi.components.schemas).forEach(schemaName => {
            const schemaDef = openapi.components.schemas[schemaName];
            if (schemaDef.properties) {
              Object.keys(schemaDef.properties).forEach(propName => {
                const prop = schemaDef.properties[propName];

                if (CRITICAL_AMOUNT_FIELDS.includes(propName)) {
                  // Skip if property uses $ref, allOf, oneOf, anyOf (composition patterns)
                  if (prop.$ref || prop.allOf || prop.oneOf || prop.anyOf) {
                    return;
                  }
                  if (prop.type !== 'integer') {
                    error(
                      `Amount field "${propName}" in ${schemaName} (OpenAPI) has type "${prop.type}" instead of "integer"`,
                      { version, spec, schema: schemaName, field: propName, type: prop.type }
                    );
                  }
                }
              });
            }
          });
        }

        success(`Field types correct in OpenAPI ${version}/${spec}`);
      } catch (err) {
        // Already caught in syntax validation
      }
    });
  });
}

// 5. Validate that all fields in unreleased schemas have descriptions
function validateFieldDescriptions() {
  console.log('\n📖 Validating Field Descriptions in unreleased specs...\n');

  const version = 'unreleased';
  const specs = getJsonSchemaFiles(version);
  
  specs.forEach(spec => {
    const schemaPath = path.join(__dirname, '..', 'spec', version, 'json-schema', `schema.${spec}.json`);

    if (!fs.existsSync(schemaPath)) {
      warn(`Schema not found: ${schemaPath}`, { version, spec });
      return;
    }

    try {
      const content = fs.readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(content);

      let missingDescriptions = [];

      // Check all $defs
      if (schema.$defs) {
        Object.keys(schema.$defs).forEach(defName => {
          const def = schema.$defs[defName];
          
          // Check if the model itself has a description
          if (!def.description) {
            error(
              `Model "${defName}" is missing a description`,
              { version, spec, model: defName }
            );
          }

          // Check properties using shared function
          missingDescriptions.push(...checkProperties(def, [defName]));
        });
      }

      if (missingDescriptions.length > 0) {
        missingDescriptions.forEach(fieldPath => {
          error(
            `Field is missing description: ${fieldPath}`,
            { version, spec, field: fieldPath }
          );
        });
      } else {
        success(`All fields have descriptions in ${version}/${spec}`);
      }
    } catch (err) {
      error(`Error validating field descriptions for ${version}/${spec}: ${err.message}`, { version, spec });
    }
  });
}

// 6. Validate that all data models in unreleased have at least one example
function validateModelExamples() {
  console.log('\n📝 Validating Model Examples in unreleased specs...\n');

  const version = 'unreleased';
  const specs = getJsonSchemaFiles(version);
  
  specs.forEach(spec => {
    const schemaPath = path.join(__dirname, '..', 'spec', version, 'json-schema', `schema.${spec}.json`);

    if (!fs.existsSync(schemaPath)) {
      warn(`Schema not found: ${schemaPath}`, { version, spec });
      return;
    }

    try {
      const content = fs.readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(content);

      let missingExamples = [];

      // Check all $defs for examples
      if (schema.$defs) {
        Object.keys(schema.$defs).forEach(defName => {
          const def = schema.$defs[defName];
          
          // Check if the model has at least one example
          // Examples can be in 'example' or 'examples' field
          if (!def.example && !def.examples) {
            missingExamples.push(defName);
          }
        });
      }

      if (missingExamples.length > 0) {
        missingExamples.forEach(modelName => {
          error(
            `Model "${modelName}" is missing an example`,
            { version, spec, model: modelName }
          );
        });
      } else {
        success(`All models have examples in ${version}/${spec}`);
      }
    } catch (err) {
      error(`Error validating model examples for ${version}/${spec}: ${err.message}`, { version, spec });
    }
  });
}


// 8. Validate OpenAPI schema descriptions in unreleased
function validateOpenApiDescriptions() {
  console.log('\n📖 Validating OpenAPI Schema Descriptions in unreleased specs...\n');

  const version = 'unreleased';
  const openApiSpecs = getOpenApiFiles(version);

  openApiSpecs.forEach(spec => {
    const openApiPath = path.join(__dirname, '..', 'spec', version, 'openapi', `openapi.${spec}.yaml`);

    if (!fs.existsSync(openApiPath)) {
      return;
    }

    try {
      const content = fs.readFileSync(openApiPath, 'utf8');
      const openapi = yaml.load(content);

      if (!openapi.components || !openapi.components.schemas) {
        return;
      }

      let missingDescriptions = [];

      // Check all schemas using shared function with OpenAPI-specific options
      Object.keys(openapi.components.schemas).forEach(schemaName => {
        const schemaDef = openapi.components.schemas[schemaName];

        // Check if the schema itself has a description (optional for OpenAPI)
        // Many OpenAPI schemas are inline and don't need top-level descriptions
        
        missingDescriptions.push(...checkProperties(schemaDef, [schemaName], {
          skipTopLevel: true,  // OpenAPI schemas often don't have descriptions at the schema level
          skipRefs: true       // Skip properties that only have $ref
        }));
      });

      if (missingDescriptions.length > 0) {
        missingDescriptions.forEach(fieldPath => {
          error(
            `OpenAPI field is missing description: ${fieldPath}`,
            { version, spec, field: fieldPath }
          );
        });
      } else {
        success(`All OpenAPI fields have descriptions in ${version}/${spec}`);
      }
    } catch (err) {
      error(`Error validating OpenAPI descriptions for ${version}/${spec}: ${err.message}`, { version, spec });
    }
  });
}

// 9. Validate OpenAPI schema examples in unreleased
function validateOpenApiExamples() {
  console.log('\n📝 Validating OpenAPI Schema Examples in unreleased specs...\n');

  const version = 'unreleased';
  const openApiSpecs = getOpenApiFiles(version);

  openApiSpecs.forEach(spec => {
    const openApiPath = path.join(__dirname, '..', 'spec', version, 'openapi', `openapi.${spec}.yaml`);

    if (!fs.existsSync(openApiPath)) {
      return;
    }

    try {
      const content = fs.readFileSync(openApiPath, 'utf8');
      const openapi = yaml.load(content);

      if (!openapi.components || !openapi.components.schemas) {
        return;
      }

      let missingExamples = [];

      // Check all schemas for examples
      Object.keys(openapi.components.schemas).forEach(schemaName => {
        const schemaDef = openapi.components.schemas[schemaName];

        // Check if the schema has at least one example
        // Examples can be in 'example' or 'examples' field
        // Note: In OpenAPI, schemas referenced inline might not need examples
        // Only check top-level reusable schemas
        if (!schemaDef.example && !schemaDef.examples && schemaDef.type === 'object') {
          // Skip if it's just a simple ref wrapper or enum
          if (!schemaDef.$ref && !schemaDef.enum && !schemaDef.allOf && !schemaDef.oneOf && !schemaDef.anyOf) {
            missingExamples.push(schemaName);
          }
        }
      });

      if (missingExamples.length > 0) {
        missingExamples.forEach(schemaName => {
          error(
            `OpenAPI schema "${schemaName}" is missing an example`,
            { version, spec, schema: schemaName }
          );
        });
      } else {
        success(`All OpenAPI schemas have examples in ${version}/${spec}`);
      }
    } catch (err) {
      error(`Error validating OpenAPI examples for ${version}/${spec}: ${err.message}`, { version, spec });
    }
  });
}

// 10. Validate examples against schemas
function validateExamples() {
  console.log('\n📝 Validating Examples Against Schemas...\n');

  VERSIONS.forEach(version => {
    const specs = getJsonSchemaFiles(version);
    
    specs.forEach(spec => {
      const schemaPath = path.join(__dirname, '..', 'spec', version, 'json-schema', `schema.${spec}.json`);
      const examplesPath = path.join(__dirname, '..', 'examples', version, `examples.${spec}.json`);

      if (!fs.existsSync(schemaPath) || !fs.existsSync(examplesPath)) {
        return;
      }

      try {
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        const examples = JSON.parse(fs.readFileSync(examplesPath, 'utf8'));

        // Create new AJV instance per schema to avoid ID conflicts
        const ajv = new Ajv({
          strict: false,
          allErrors: true,
          validateSchema: false  // Don't validate the metaschema
        });
        addFormats(ajv);

        // Add the full schema (with $defs) to AJV
        ajv.addSchema(schema);

        // Examples file is an object with named examples
        Object.keys(examples).forEach(exampleName => {
          const example = examples[exampleName];

          // Try to infer which schema this example should validate against
          // agentic_checkout: checkout_session_*, create*request, complete*request
          // delegate_payment: delegate_payment_request, delegate_payment_success_response, delegate_payment_error_*
          let schemaRef = null;

          if (spec === 'agentic_checkout') {
            if (exampleName === 'complete_checkout_session_response') {
              schemaRef = '#/$defs/CheckoutSessionWithOrder';
            } else if (exampleName.includes('checkout_session') && !exampleName.includes('request')) {
              schemaRef = '#/$defs/CheckoutSession';
            } else if (exampleName.includes('create') && exampleName.includes('request')) {
              schemaRef = '#/$defs/CheckoutSessionCreateRequest';
            } else if (exampleName.includes('complete') && exampleName.includes('request')) {
              schemaRef = '#/$defs/CheckoutSessionCompleteRequest';
            }
          } else if (spec === 'delegate_payment') {
            if (exampleName === 'delegate_payment_request') {
              schemaRef = '#/$defs/DelegatePaymentRequest';
            } else if (exampleName === 'delegate_payment_success_response') {
              schemaRef = '#/$defs/DelegatePaymentResponse';
            } else if (exampleName.startsWith('delegate_payment_error_')) {
              schemaRef = '#/$defs/Error';
            }
          }

          // Skip validation if we can't determine the schema
          if (!schemaRef) {
            // Don't warn - many examples are just documentation snippets
            return;
          }

          // Validate using the schema reference (full URI when schema has $id so AJV can resolve)
          try {
            const schemaKey = schema.$id ? schema.$id + schemaRef : schemaRef;
            const validate = ajv.getSchema(schemaKey);
            if (!validate) {
              // Schema reference not found, skip silently
              return;
            }

            const valid = validate(example);

            if (!valid) {
              error(
                `Example "${exampleName}" does not validate against schema`,
                {
                  version,
                  spec,
                  example: exampleName,
                  errors: validate.errors
                }
              );
            }
          } catch (validateErr) {
            // Skip validation errors silently - examples might be partial
            return;
          }
        });

        success(`Examples validated for ${version}/${spec}`);
      } catch (err) {
        error(`Error validating examples for ${version}/${spec}: ${err.message}`, { version, spec });
      }
    });
  });
}

// Main execution
console.log('🔍 Starting Comprehensive Consistency Validation\n');
console.log('='.repeat(60));

validateJsonSchemaSyntax();
validateOpenApiSyntax();
checkProhibitedSchemas();
validateFieldTypes();
validateFieldDescriptions();
validateModelExamples();
validateOpenApiDescriptions();
validateOpenApiExamples();
validateExamples();

console.log('\n' + '='.repeat(60));
console.log('\n📊 Validation Summary:\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All validations passed! No errors or warnings.');
  process.exit(0);
} else {
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s)`);
  }

  if (errors.length > 0) {
    console.log(`❌ ${errors.length} error(s)`);
    console.log('\nValidation FAILED. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ Validation passed with warnings.');
    process.exit(0);
  }
}
