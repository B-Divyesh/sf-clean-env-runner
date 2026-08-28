import test from 'node:test';
import assert from 'node:assert/strict';
import { auditManifest, PRESETS } from '../src/manifest.mjs';

test('safe documented example passes', () => {
  const result = auditManifest(PRESETS.safe);
  assert.equal(result.valid, true);
  assert.equal(result.variables.length, 3);
  assert.equal(result.variables[2].secret, true);
});

test('empty boundary is valid and explicit', () => {
  const result = auditManifest(PRESETS.empty);
  assert.equal(result.valid, true);
  assert.deepEqual(result.variables, []);
});

test('literal secrets are rejected without echoing the value', () => {
  const result = auditManifest(PRESETS.broken);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /literal secrets are refused/);
  assert.doesNotMatch(result.errors.join(' '), /secret-does-not-belong/);
});
