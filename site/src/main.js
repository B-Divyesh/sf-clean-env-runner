import './style.css';
import { auditManifest, PRESETS } from './manifest.mjs';

const manifest = document.querySelector('#manifest');
const output = document.querySelector('#audit-output');
const mark = document.querySelector('#audit-mark');
const presets = [...document.querySelectorAll('[data-preset]')];
const offline = document.querySelector('#offline');

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function renderAudit() {
  const audit = auditManifest(manifest.value);
  mark.textContent = audit.valid ? 'Pass' : `${audit.errors.length} ${audit.errors.length === 1 ? 'error' : 'errors'}`;
  mark.className = `audit-mark ${audit.valid ? 'pass' : 'fail'}`;

  if (!audit.valid) {
    output.innerHTML = `<ul class="error-list">${audit.errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}</ul><p class="audit-note">Fix the marked contract before running it.</p>`;
    return;
  }
  if (audit.variables.length === 0) {
    output.innerHTML = '<div class="empty-proof"><span aria-hidden="true">∅</span><strong>Empty boundary</strong><p>Valid. The child receives zero environment variables.</p></div>';
    return;
  }
  output.innerHTML = `<table><caption>${audit.variables.length} declared ${audit.variables.length === 1 ? 'variable' : 'variables'}</caption><thead><tr><th>Name</th><th>Source</th><th>Handling</th></tr></thead><tbody>${audit.variables.map((variable) => `<tr><td><code>${escapeHtml(variable.name)}</code></td><td>${escapeHtml(variable.sources[0])}</td><td>${variable.secret ? 'Redacted' : 'Visible'}${variable.required ? ' · required' : ' · optional'}</td></tr>`).join('')}</tbody></table><p class="audit-note">Everything not listed is removed before the child starts.</p>`;
}

manifest.value = PRESETS.safe;
manifest.addEventListener('input', renderAudit);
presets.forEach((button) => button.addEventListener('click', () => {
  presets.forEach((item) => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  manifest.value = PRESETS[button.dataset.preset];
  renderAudit();
  manifest.focus();
}));

document.querySelector('.copy').addEventListener('click', async (event) => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(event.currentTarget.dataset.copy);
    event.currentTarget.textContent = 'Copied';
    status.textContent = 'Command copied to clipboard.';
  } catch {
    status.textContent = 'Clipboard access was blocked. Select the command and copy it manually.';
  }
});

function updateConnection() {
  offline.hidden = navigator.onLine;
}
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
updateConnection();
renderAudit();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
