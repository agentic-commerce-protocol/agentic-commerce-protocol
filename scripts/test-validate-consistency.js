#!/usr/bin/env node

/**
 * Regression tests for the JSON Schema <-> OpenAPI property-consistency check
 * in validate-consistency.js (see issue #297).
 *
 * node:assert only -- no test framework dependency. Run with:
 *   pnpm run test:consistency
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const {
  comparePropertySets,
  findPropertyDriftForSpec,
  classifyPropertyDrift,
  validateSchemaPropertyConsistency,
  getReportedIssues,
  resetReportedIssues
} = require('./validate-consistency.js');

const VERSIONS = ['2025-09-29', '2025-12-12', '2026-01-16', '2026-01-30', '2026-04-17', 'unreleased'];
const SPEC_ROOT = path.join(__dirname, '..', 'spec');

let failed = 0;
let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✅ ${name}`);
  } catch (err) {
    failed++;
    console.error(`❌ ${name}\n   ${err.message}`);
  }
}

// A closed object schema declaring the given property names.
function obj(...propNames) {
  const properties = {};
  propNames.forEach(n => { properties[n] = { type: 'string' }; });
  return { type: 'object', additionalProperties: false, properties };
}

// Assert the drift reported for a pair, in both directions at once.
function assertDrift(jsonDef, openApiDef, expected, label) {
  const result = comparePropertySets(jsonDef, openApiDef);
  assert.strictEqual(result.comparable, expected.comparable, `${label}: comparable`);
  assert.deepStrictEqual(result.jsonOnly, expected.jsonOnly || [], `${label}: jsonOnly`);
  assert.deepStrictEqual(result.openApiOnly, expected.openApiOnly || [], `${label}: openApiOnly`);
}

// --- Behaviour of the comparison ----------------------------------------

test('identical property sets report no drift, regardless of order', () => {
  assertDrift(obj('id', 'name'), obj('name', 'id'), { comparable: true }, 'identical');
});

test('a property only in JSON Schema is reported as jsonOnly', () => {
  assertDrift(obj('id', 'order_notes'), obj('id'),
    { comparable: true, jsonOnly: ['order_notes'] }, 'json-only');
});

test('a property only in OpenAPI is reported as openApiOnly', () => {
  assertDrift(obj('id'), obj('id', 'legacy'),
    { comparable: true, openApiOnly: ['legacy'] }, 'openapi-only');
});

test('both directions are reported from a single comparison', () => {
  assertDrift(obj('id', 'j'), obj('id', 'o'),
    { comparable: true, jsonOnly: ['j'], openApiOnly: ['o'] }, 'both');
});

test('reported names are sorted, so output is deterministic', () => {
  assertDrift(obj('id', 'zeta', 'alpha'), obj('id'),
    { comparable: true, jsonOnly: ['alpha', 'zeta'] }, 'sorted');
});

// --- Pairs that must NOT be compared ------------------------------------

// Composition and conditionals pull properties in from elsewhere, so the
// declared `properties` map is an incomplete picture and comparing the two
// maps would report drift that isn't real. Each case below would produce a
// false positive if it were compared.
const NOT_COMPARABLE = {
  'allOf on the JSON Schema side': [{ type: 'object', allOf: [{ $ref: '#/$defs/Base' }], properties: { id: {} } }, obj('id', 'inherited')],
  'allOf on the OpenAPI side': [obj('id', 'extra'), { type: 'object', allOf: [{ $ref: '#/c/Base' }], properties: { id: {} } }],
  'oneOf union': [{ type: 'object', oneOf: [], properties: { id: {} } }, obj('id', 'variant')],
  'anyOf union': [{ type: 'object', anyOf: [], properties: { id: {} } }, obj('id', 'variant')],
  'bare $ref wrapper': [obj('id'), { $ref: '#/components/schemas/Other' }],
  'if/then conditional': [{ type: 'object', properties: { id: {} }, if: {}, then: {} }, obj('id', 'conditional')],
  'discriminated union': [obj('type'), { type: 'object', properties: { type: {} }, discriminator: { propertyName: 'type' } }],
  'patternProperties': [{ type: 'object', properties: { id: {} }, patternProperties: { '^x-': {} } }, obj('id', 'x_custom')],
  'free-form map with no properties': [{ type: 'object', additionalProperties: true }, { type: 'object', additionalProperties: true }],
  'enum / scalar': [{ type: 'string', enum: ['a'] }, { type: 'string', enum: ['a'] }],
  'missing definition': [null, obj('id')]
};

Object.entries(NOT_COMPARABLE).forEach(([label, [jsonDef, openApiDef]]) => {
  test(`skipped, reports no drift: ${label}`, () => {
    assertDrift(jsonDef, openApiDef, { comparable: false }, label);
    assert.ok(comparePropertySets(jsonDef, openApiDef).skipReason, `${label}: skipReason is set`);
  });
});

test('an open object that declares properties is still compared', () => {
  // additionalProperties: true does not excuse drift in the *declared* names:
  // the two artifacts still disagree about what is documented.
  assertDrift(
    { type: 'object', additionalProperties: true, properties: { id: {}, drifted: {} } },
    { type: 'object', additionalProperties: true, properties: { id: {} } },
    { comparable: true, jsonOnly: ['drifted'] },
    'open object'
  );
});

// --- Enforcement behaviour (classifyPropertyDrift / validateSchemaPropertyConsistency) --
//
// The tests above cover comparePropertySets, a pure diff of two schemas. None
// of them exercise the enforcement layer that decides, given a detected-drift
// list and a baseline, what is tolerated, what is new, and what is stale --
// that is what actually gates validate:all. These tests target that layer
// directly with a small synthetic fixture, independent of the repository's
// current mismatches.

// A single synthetic drift record, shaped like findPropertyDrift()'s output.
function drift(direction, overrides = {}) {
  const d = { version: 'v1', spec: 'spec1', schema: 'Widget', property: 'field', direction, ...overrides };
  d.key = `${d.version}/${d.spec}/${d.schema}/${d.property} ${d.direction}`;
  return d;
}

// A baseline Map, shaped like loadKnownPropertyDrift()'s output: key -> line.
function baseline(...keys) {
  return new Map(keys.map((key, i) => [key, i + 1]));
}

test('classifyPropertyDrift: known drift (detected matches baseline) is tolerated, not new or stale', () => {
  const d = drift('json-only');
  const result = classifyPropertyDrift([d], baseline(d.key));
  assert.deepStrictEqual(result.known, [d.key]);
  assert.deepStrictEqual(result.newDrift, []);
  assert.deepStrictEqual(result.stale, []);
});

test('classifyPropertyDrift: new drift (detected, empty baseline) is reported as new, json-only', () => {
  const d = drift('json-only');
  const result = classifyPropertyDrift([d], baseline());
  assert.deepStrictEqual(result.known, []);
  assert.deepStrictEqual(result.newDrift, [d]);
  assert.deepStrictEqual(result.stale, []);
});

test('classifyPropertyDrift: new drift (detected, empty baseline) is reported as new, openapi-only', () => {
  const d = drift('openapi-only');
  const result = classifyPropertyDrift([d], baseline());
  assert.deepStrictEqual(result.known, []);
  assert.deepStrictEqual(result.newDrift, [d]);
  assert.deepStrictEqual(result.stale, []);
});

test('classifyPropertyDrift: stale baseline (empty detected, baseline has an entry) is reported as stale', () => {
  const d = drift('json-only');
  const result = classifyPropertyDrift([], baseline(d.key));
  assert.deepStrictEqual(result.known, []);
  assert.deepStrictEqual(result.newDrift, []);
  assert.deepStrictEqual(result.stale, [{ key: d.key, line: 1 }]);
});

test('classifyPropertyDrift: independently tracks known, new and stale within one call', () => {
  const knownEntry = drift('json-only', { property: 'known_field' });
  const newEntry = drift('openapi-only', { property: 'new_field' });
  const staleEntry = drift('json-only', { property: 'stale_field' });
  const result = classifyPropertyDrift(
    [knownEntry, newEntry],
    baseline(knownEntry.key, staleEntry.key)
  );
  assert.deepStrictEqual(result.known, [knownEntry.key]);
  assert.deepStrictEqual(result.newDrift, [newEntry]);
  assert.deepStrictEqual(result.stale, [{ key: staleEntry.key, line: 2 }]);
});

// A mutant that tolerates every drift (classifyPropertyDrift always reports
// `known`, never `newDrift`) would pass every test above except this one:
// undetected drift with no baseline entry must still surface as new.
test('classifyPropertyDrift: broken "tolerate everything" logic is detectable', () => {
  const d = drift('json-only');
  const result = classifyPropertyDrift([d], baseline());
  assert.strictEqual(result.newDrift.length, 1, 'undetected, unbaselined drift must be reported as new, not tolerated');
});

// A mutant that never reports stale entries (e.g. removing the `stale`
// computation) would pass every test above except this one.
test('classifyPropertyDrift: broken "ignore stale baseline" logic is detectable', () => {
  const d = drift('json-only');
  const result = classifyPropertyDrift([], baseline(d.key));
  assert.strictEqual(result.stale.length, 1, 'a baseline entry matching nothing detected must be reported as stale');
});

// findPropertyDriftForSpec collects both directions from comparePropertySets
// into drift records. A mutant that drops the openApiOnly.forEach call (or
// otherwise stops collecting that direction before enforcement sees it)
// would pass every classifyPropertyDrift/validateSchemaPropertyConsistency
// test above, since those inject drift records directly -- this is the one
// that has to call findPropertyDriftForSpec itself to catch it.
test('findPropertyDriftForSpec: both json-only and openapi-only drift are collected for a schema pair', () => {
  const jsonDefs = { Widget: obj('id', 'json_extra') };
  const openApiSchemas = { Widget: obj('id', 'openapi_extra') };
  const records = findPropertyDriftForSpec('v1', 'spec1', jsonDefs, openApiSchemas);

  const jsonOnlyRecord = records.find(r => r.direction === 'json-only');
  const openApiOnlyRecord = records.find(r => r.direction === 'openapi-only');

  assert.ok(jsonOnlyRecord, 'json-only drift must be collected');
  assert.strictEqual(jsonOnlyRecord.property, 'json_extra');

  assert.ok(openApiOnlyRecord, 'openapi-only drift must be collected -- broken if this is missing');
  assert.strictEqual(openApiOnlyRecord.property, 'openapi_extra');

  assert.strictEqual(records.length, 2, 'no other drift should be reported for a single differing property per side');
});

// validateSchemaPropertyConsistency wires classifyPropertyDrift's output into
// error()/warn() reporting. These tests inject a fixture pair (via the
// detectedDrift/knownDrift parameters) instead of depending on the
// repository's current 23 mismatches, so they hold even as those are fixed.
function issuesReportedFor(detectedDrift, knownDrift) {
  resetReportedIssues();
  validateSchemaPropertyConsistency(detectedDrift, knownDrift);
  return getReportedIssues();
}

test('validateSchemaPropertyConsistency: new json-only drift is reported as an error', () => {
  const d = drift('json-only');
  const { errors } = issuesReportedFor([d], baseline());
  assert.ok(errors.some(e => e.message.includes('NEW PROPERTY DRIFT') && e.key === d.key));
});

test('validateSchemaPropertyConsistency: new openapi-only drift is reported as an error under the symmetric policy', () => {
  // PROPERTY_DRIFT_SYMMETRIC is true in validate-consistency.js: an
  // OpenAPI-only mismatch must fail exactly like a JSON-only one, not just
  // warn. If a change silently drops OpenAPI-only drift before it reaches
  // this function (e.g. in findPropertyDrift), this record never arrives
  // here and this test would need to inject it to fail -- which is exactly
  // what it does.
  const d = drift('openapi-only');
  const { errors, warnings } = issuesReportedFor([d], baseline());
  assert.ok(errors.some(e => e.message.includes('NEW PROPERTY DRIFT') && e.key === d.key),
    'openapi-only drift must be an error, not merely a warning, under the symmetric policy');
  assert.ok(!warnings.some(w => w.key === d.key));
});

test('validateSchemaPropertyConsistency: known drift produces no error or warning', () => {
  const d = drift('json-only');
  const { errors, warnings } = issuesReportedFor([d], baseline(d.key));
  assert.strictEqual(errors.length, 0);
  assert.strictEqual(warnings.length, 0);
});

test('validateSchemaPropertyConsistency: a stale baseline entry is reported as an error', () => {
  const d = drift('json-only');
  const { errors } = issuesReportedFor([], baseline(d.key));
  assert.ok(errors.some(e => e.message.includes('STALE BASELINE ENTRY') && e.message.includes(d.key)));
});

// --- The real artifacts -------------------------------------------------

function loadPair(version, spec) {
  const schema = JSON.parse(fs.readFileSync(path.join(SPEC_ROOT, version, 'json-schema', `schema.${spec}.json`), 'utf8'));
  const openapi = yaml.load(fs.readFileSync(path.join(SPEC_ROOT, version, 'openapi', `openapi.${spec}.yaml`), 'utf8'));
  return [schema.$defs || {}, (openapi.components && openapi.components.schemas) || {}];
}

// Every (version, spec, schema) pair that publishes both artifacts.
function eachComparablePair(fn) {
  VERSIONS.forEach(version => {
    const jsonDir = path.join(SPEC_ROOT, version, 'json-schema');
    if (!fs.existsSync(jsonDir)) return;
    fs.readdirSync(jsonDir)
      .filter(f => f.startsWith('schema.') && f.endsWith('.json'))
      .forEach(file => {
        const spec = file.slice('schema.'.length, -'.json'.length);
        if (!fs.existsSync(path.join(SPEC_ROOT, version, 'openapi', `openapi.${spec}.yaml`))) return;
        const [jsonDefs, openApiSchemas] = loadPair(version, spec);
        Object.keys(jsonDefs)
          .filter(name => Object.prototype.hasOwnProperty.call(openApiSchemas, name))
          .forEach(name => {
            const result = comparePropertySets(jsonDefs[name], openApiSchemas[name]);
            if (result.comparable) fn(`${version}/${spec}/${name}`, result, version);
          });
      });
  });
}

// The six fields from #297, as `Schema.field` on the affected versions.
const ISSUE_297_DRIFT = [
  'Address.company',
  'Order.client_reference_id',
  'OrderConfirmation.order_notes',
  'CheckoutSessionCreateRequest.order_notes',
  'CheckoutSessionUpdateRequest.order_notes',
  'CheckoutSessionCompleteRequest.order_notes'
];

['2026-04-17', 'unreleased'].forEach(version => {
  test(`#297: all six reported fields are detected in ${version}`, () => {
    const [jsonDefs, openApiSchemas] = loadPair(version, 'agentic_checkout');
    ISSUE_297_DRIFT.forEach(entry => {
      const [schemaName, field] = entry.split('.');
      const result = comparePropertySets(jsonDefs[schemaName], openApiSchemas[schemaName]);
      assert.ok(result.comparable, `${schemaName} should be comparable`);
      assert.ok(result.jsonOnly.includes(field),
        `expected ${entry} in jsonOnly, got [${result.jsonOnly}]`);
    });
  });
});

// Control: the issue reports 2026-01-30 as clean of these six fields, so the
// check must not fire there.
test('#297: none of the six fields drift in 2026-01-30', () => {
  const [jsonDefs, openApiSchemas] = loadPair('2026-01-30', 'agentic_checkout');
  ISSUE_297_DRIFT.forEach(entry => {
    const [schemaName, field] = entry.split('.');
    const result = comparePropertySets(jsonDefs[schemaName], openApiSchemas[schemaName]);
    assert.ok(!result.jsonOnly.includes(field), `${entry} unexpectedly drifted in 2026-01-30`);
  });
});

test('2025-09-29 is free of property drift in both directions', () => {
  eachComparablePair((label, result, version) => {
    if (version !== '2025-09-29') return;
    assert.deepStrictEqual(result.jsonOnly, [], `${label} jsonOnly`);
    assert.deepStrictEqual(result.openApiOnly, [], `${label} openApiOnly`);
  });
});

// No OpenAPI-only drift exists today, so enabling the symmetric direction adds
// no failures of its own. If this fails, symmetry has found something real and
// the maintainer decision in validate-consistency.js needs revisiting.
test('no OpenAPI-only drift exists in any version', () => {
  eachComparablePair((label, result) => {
    assert.deepStrictEqual(result.openApiOnly, [], `${label} has OpenAPI-only properties`);
  });
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
