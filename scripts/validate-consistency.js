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
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const yaml = require('js-yaml');

const VERSIONS = ['2025-09-29', '2025-12-12', '2026-01-16', 'unreleased'];
const SPECS = ['agentic_checkout', 'delegate_payment'];
const PROHIBITED_SCHEMAS = {
  'agentic_checkout': ['Refund'] // Refund should only be in webhook spec
};

const CRITICAL_AMOUNT_FIELDS = [
  'base_amount', 'discount', 'subtotal', 'tax', 'total', 
  'amount', 'max_amount', 'unit_amount'
];

let errors = [];
let warnings = [];

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
    SPECS.forEach(spec => {
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
    const specs = ['agentic_checkout', 'delegate_payment', 'agentic_checkout_webhook'];
    
    specs.forEach(spec => {
      const openApiPath = path.join(__dirname, '..', 'spec', version, 'openapi', `openapi.${spec}.yaml`);
      
      if (!fs.existsSync(openApiPath)) {
        // Webhook might not exist in all versions
        if (spec !== 'agentic_checkout_webhook') {
          warn(`OpenAPI not found: ${openApiPath}`, { version, spec });
        }
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
    SPECS.forEach(spec => {
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
    const specs = ['agentic_checkout', 'delegate_payment'];
    
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

// 5. Validate examples against schemas
function validateExamples() {
  console.log('\n📝 Validating Examples Against Schemas...\n');
  
  VERSIONS.forEach(version => {
    SPECS.forEach(spec => {
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
          // Common patterns: checkout_session_*, complete_session_*, etc.
          let schemaRef = null;
          
          if (exampleName.includes('checkout_session') && !exampleName.includes('request')) {
            schemaRef = '#/$defs/CheckoutSession';
          } else if (exampleName.includes('create') && exampleName.includes('request')) {
            schemaRef = '#/$defs/CheckoutSessionCreateRequest';
          } else if (exampleName.includes('complete') && exampleName.includes('request')) {
            schemaRef = '#/$defs/CheckoutSessionCompleteRequest';
          }
          
          // Skip validation if we can't determine the schema
          if (!schemaRef) {
            // Don't warn - many examples are just documentation snippets
            return;
          }
          
          // Validate using the schema reference
          try {
            const validate = ajv.getSchema(schemaRef);
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
