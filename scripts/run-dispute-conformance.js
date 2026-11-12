#!/usr/bin/env node

/**
 * Conformance runner for the dispute_resolution extension.
 *
 * Runs examples/unreleased/dispute_resolution/conformance_cases.json against an implementation. The implementation
 * is a command named in DISPUTE_PROVIDER_CMD: for each case the runner writes the case's `input` to its stdin as one
 * JSON object and reads one JSON object from its stdout. Only the keys named in the case's `expect` are compared,
 * by deep equality with object key order ignored; any other output keys are ignored. The runner decides nothing.
 *
 *   DISPUTE_PROVIDER_CMD="python3 my_provider.py" node scripts/run-dispute-conformance.js [cases.json] [--json]
 *
 * Prints one line per disagreeing case and "N of M cases agree at <cases sha256>". Exit 0 if all agree, 1 if any
 * disagree, 2 on a usage error. Node standard library only.
 *
 * Design follows the harness published under CC0 by Tetsurohhori (aos-standard/catalog, e5fbe9c).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const casesPath = argv.find((a) => !a.startsWith('--')) ||
  path.join(__dirname, '..', 'examples', 'unreleased', 'dispute_resolution', 'conformance_cases.json');
const command = process.env.DISPUTE_PROVIDER_CMD;

if (!command) {
  console.error('DISPUTE_PROVIDER_CMD must name the command that decides one case (input on stdin, JSON on stdout).');
  process.exit(2);
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

const raw = fs.readFileSync(casesPath);
// hash with LF line endings, so the digest matches the committed blob on a CRLF checkout too
const digest = crypto.createHash('sha256').update(raw.toString('utf8').replace(/\r\n/g, '\n')).digest('hex');
const cases = JSON.parse(raw.toString('utf8')).cases;
const ids = new Set();
const rows = [];

for (const c of cases) {
  if (ids.has(c.id)) {
    console.error(`duplicate case id ${c.id}`);
    process.exit(2);
  }
  ids.add(c.id);
  const run = spawnSync(command, { shell: true, input: JSON.stringify(c.input), encoding: 'utf8', timeout: 30000 });
  let output = null;
  let error = null;
  if (run.error) error = String(run.error);
  else if (run.status !== 0) error = `exit ${run.status}: ${(run.stderr || '').trim().slice(0, 200)}`;
  else {
    try {
      output = JSON.parse(run.stdout);
      if (output === null || typeof output !== 'object' || Array.isArray(output)) error = 'stdout is not a JSON object';
    } catch (e) {
      error = 'stdout is not one JSON object';
    }
  }
  const diffs = {};
  if (!error) {
    for (const [key, expected] of Object.entries(c.expect)) {
      if (canonical(output[key]) !== canonical(expected)) {
        diffs[key] = { expected, got: output[key] === undefined ? null : output[key] };
      }
    }
  }
  rows.push({ id: c.id, agree: !error && Object.keys(diffs).length === 0, error, diffs });
}

const agree = rows.filter((r) => r.agree).length;
if (asJson) {
  console.log(JSON.stringify({ cases: path.basename(casesPath), sha256: digest, n: rows.length, agree, rows }, null, 1));
} else {
  for (const r of rows) {
    if (!r.agree) console.log(`DIFFER ${r.id}: ${r.error || JSON.stringify(r.diffs)}`);
  }
  console.log(`${agree} of ${rows.length} cases agree at ${digest.slice(0, 12)}`);
}
process.exit(agree === rows.length ? 0 : 1);
