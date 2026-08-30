import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repository = new URL('../../', import.meta.url).pathname;

async function cargoTest(...args) {
  const result = await execFileAsync('cargo', ['test', ...args], {
    cwd: repository,
    windowsHide: true,
    timeout: 120_000,
  });
  assert.match(`${result.stdout}\n${result.stderr}`, /test result: ok/);
}

test('@claim:explicit-boundary only declared variables reach the child', async () => {
  await cargoTest('--test', 'cli', 'run_exposes_only_declared_variables_and_scrubs_receipt', '--', '--exact');
});

test('@claim:receipt-secret-redaction receipts and receipt diagnostics omit declared secrets', async () => {
  await cargoTest('--test', 'cli', 'receipt_');
  await cargoTest('--test', 'cli', 'preview_and_check_redact_secrets_from_all_reported_metadata', '--', '--exact');
});

test('@claim:literal-secret-refusal literal secret declarations are rejected', async () => {
  await cargoTest('--lib', 'rejects_literal_secret');
});

test('@claim:demo-command the bundled demo runs from one command', async () => {
  await cargoTest('--test', 'cli', 'demo_runs_the_bundled_sample_in_an_isolated_directory', '--', '--exact');
});

test('@claim:json-output reporting commands emit parseable JSON', async () => {
  await cargoTest('--test', 'cli', 'reporting_commands_emit_machine_readable_json', '--', '--exact');
});

test('@claim:stable-exits missing input and child failures use documented exits', async () => {
  await cargoTest('--test', 'cli', 'missing_required_input_uses_noinput_exit_code', '--', '--exact');
  await cargoTest('--test', 'cli', 'child_exit_code_is_preserved', '--', '--exact');
});

test('@claim:mit-license the distribution includes the MIT License', async () => {
  const license = await readFile(new URL('../../LICENSE', import.meta.url), 'utf8');
  assert.match(license, /Permission is hereby granted, free of charge/);
  assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/);
});

test('@claim:single-binary Cargo defines one executable target', async () => {
  const { stdout } = await execFileAsync('cargo', ['metadata', '--no-deps', '--format-version', '1'], {
    cwd: repository,
    windowsHide: true,
  });
  const metadata = JSON.parse(stdout);
  const targets = metadata.packages[0].targets.filter((target) => target.kind.includes('bin'));
  assert.deepEqual(targets.map((target) => target.name), ['clean-env']);
});

test('@claim:init-no-overwrite init preserves an existing manifest', async () => {
  await cargoTest('--test', 'cli', 'init_refuses_to_overwrite_an_existing_manifest', '--', '--exact');
});

test('@claim:receipt-controls receipt writing can be disabled or redirected', async () => {
  await cargoTest('--test', 'cli', 'receipt_controls_disable_or_redirect_receipt_writes', '--', '--exact');
});

test('@claim:declared-path-resolution bare commands use the declared child PATH', async () => {
  await cargoTest('--test', 'cli', 'bare_executable_is_resolved_from_the_declared_path', '--', '--exact');
});
