export const PRESETS = {
  safe: `version = 1

[env.PATH]
inherit = true
required = true

[env.NODE_ENV]
value = "test"

[env.DEPLOY_TOKEN]
from_env = "MY_DEPLOY_TOKEN"
secret = true
required = false`,
  empty: `version = 1

# No [env.NAME] tables means the child receives no variables.`,
  broken: `version = 1

[env.DEPLOY_TOKEN]
value = "secret-does-not-belong-here"
secret = true`,
};

const namePattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function auditManifest(source) {
  const lines = source.split(/\r?\n/);
  const errors = [];
  const variables = [];
  let version = null;
  let current = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const table = line.match(/^\[env\.([^\]]+)\]$/);
    if (table) {
      if (!namePattern.test(table[1])) errors.push(`Line ${index + 1}: invalid variable name.`);
      current = { name: table[1], sources: [], secret: false, required: true };
      variables.push(current);
      continue;
    }
    const pair = line.match(/^([a-z_]+)\s*=\s*(.+)$/);
    if (!pair) {
      errors.push(`Line ${index + 1}: expected a key, value, or [env.NAME] table.`);
      continue;
    }
    const [, key, raw] = pair;
    if (!current) {
      if (key === 'version' && raw === '1') version = 1;
      else errors.push(`Line ${index + 1}: only version is allowed before an env table.`);
      continue;
    }
    if (key === 'value' || key === 'inherit' || key === 'from_env') current.sources.push(key);
    else if (key === 'secret') current.secret = raw === 'true';
    else if (key === 'required') current.required = raw !== 'false';
    else errors.push(`Line ${index + 1}: unknown field “${key}”.`);
  }

  if (version !== 1) errors.unshift('Manifest must declare version = 1.');
  const seen = new Set();
  for (const variable of variables) {
    if (seen.has(variable.name)) errors.push(`${variable.name}: duplicate variable table.`);
    seen.add(variable.name);
    if (variable.sources.length !== 1) errors.push(`${variable.name}: choose exactly one source.`);
    if (variable.secret && variable.sources.includes('value')) errors.push(`${variable.name}: literal secrets are refused.`);
  }

  return { valid: errors.length === 0, errors, variables };
}
