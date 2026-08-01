#!/usr/bin/env node

/**
 * Semantic OpenAPI validation using @apidevtools/swagger-parser.
 *
 * Ensures each spec document parses as OpenAPI 2/3, resolves $ref, and
 * passes the parser's structural validation (beyond YAML load + openapi/info/paths checks).
 */

const fs = require('fs');
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');

const VERSIONS = ['2025-09-29', '2025-12-12', '2026-01-16', '2026-01-30', 'unreleased'];

function getOpenApiFiles(version) {
  const openApiDir = path.join(__dirname, '..', 'spec', version, 'openapi');
  if (!fs.existsSync(openApiDir)) {
    return [];
  }
  return fs
    .readdirSync(openApiDir)
    .filter((file) => file.endsWith('.yaml') && file.startsWith('openapi.'))
    .map((file) => file.replace('openapi.', '').replace('.yaml', ''));
}

async function main() {
  const failures = [];

  for (const version of VERSIONS) {
    const specs = getOpenApiFiles(version);
    for (const spec of specs) {
      const openApiPath = path.join(
        __dirname,
        '..',
        'spec',
        version,
        'openapi',
        `openapi.${spec}.yaml`
      );
      if (!fs.existsSync(openApiPath)) {
        continue;
      }
      try {
        await SwaggerParser.validate(openApiPath);
        console.log(`✅ OpenAPI valid: ${version}/${spec}`);
      } catch (err) {
        const rel = path.relative(path.join(__dirname, '..'), openApiPath);
        console.error(`❌ OpenAPI validation failed: ${version}/${spec}`);
        console.error(err.message || String(err));
        failures.push({ file: rel, error: err });
      }
    }
  }

  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} OpenAPI file(s) failed validation.`);
    process.exit(1);
  }

  console.log('\n✅ All OpenAPI documents passed semantic validation.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
