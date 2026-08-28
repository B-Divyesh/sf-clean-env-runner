# Independent verification report — FAIL

**Work order:** `clean-env-runner-verify-3`  
**Candidate:** `e7cd775a252fdda410da8d08e6c213322d0ccecc` (`main`)  
**Verified URL:** <https://clean-env-runner.sociobot.in/>  
**Date:** 2026-08-28 UTC

## Verdict

**FAIL.** The candidate builds, packages, installs, and performs the intended explicit
environment-boundary job. The live deployment is byte-identical to its site build and passes
security, cache, responsive, offline, and performance checks. It still violates the brief's
non-negotiable "Never log secret values" constraint: a declared secret is written to a run
receipt when it appears in the current working-directory path. The standalone footer links
also miss the 44×44 CSS px mobile touch-target requirement.

## Defects

### High — declared secret leaks through `working_directory` in run receipts

In a fresh consumer install of the packaged crate, I set
`SOURCE_TOKEN=cwd-secret-qa-47291`, declared `TOKEN` as `secret = true` sourced from it, and
ran from a directory named `cwd-secret-qa-47291`. The generated receipt contained:

```json
"working_directory": "/tmp/clean-env-consumer-56rCsX/cases/cwd-secret-qa-47291"
```

`rg 'cwd-secret-qa-47291' receipt.json` matched. The command and receipt environment
metadata were scrubbed, so this is an incomplete redaction boundary. `src/main.rs` assigns
`cwd.display().to_string()` directly to `Receipt::working_directory` while it redacts only
command arguments. This contradicts the brief, README, and live privacy policy. Redact every
receipt string field, including working directory and error paths, and add a regression test
from a secret-bearing directory.

### Medium — footer links have 19.2 px high mobile targets

At 390×844, footer link dimensions were Privacy 50.4×19.2, Terms 36×19.2, Source & README
108×19.2, and Back to masthead 129.6×19.2 CSS px. The same treatment is used on the policy
pages. This misses the required 44×44 px touch target. Add non-overlapping block padding or
a 44 px minimum block size.

### Low — crate package contains unrelated dependency documentation

After clean `npm ci`, `cargo package --locked --allow-dirty --list` contained 46 files; 36
were `node_modules/**/README.md` or `LICENSE` files. The crate verifies and installs, but a
publishable CLI crate should not ship workspace dependency documentation. Tighten package
include/exclude rules.

## Passing evidence

### Clean checkout and gates

- Fresh clone was clean and detached at the requested SHA.
- `npm ci` installed 21 packages; `npm audit --audit-level=low` found 0 vulnerabilities.
- `npm test` passed 4 Rust unit, 4 Rust CLI integration, and 7 site/release tests.
  `cargo fmt --check` and `cargo clippy --all-targets --all-features -- -D warnings` passed.
  No other repository lint/typecheck scripts exist.
- Exact `npm run build` passed and produced `dist/bin/clean-env` and `dist/site`.
  `npm run test:release` passed. Staged and release binary SHA-256 matched:
  `e66c02024dbb839df0a58a101778a00d13c620c190f5e9e99e008b9803490b59`.
- `npm run test:e2e` passed 10/10 Chromium tests across desktop and 390×844 mobile.

### Packaged CLI end to end

- `cargo package --locked --allow-dirty` verified `clean-env-runner-0.1.0.crate` (233.5 KiB
  unpacked, 67.0 KiB compressed). Unpacking and `cargo install --path … --root … --locked` in
  a new consumer succeeded; `clean-env --version` returned `clean-env 0.1.0` and `--help`
  exposed init, preview, check, and run.
- A normal manifest with public literal, remapped secret, and optional-missing input exposed
  only declared variables to `/usr/bin/env`; injected `AMBIENT_LEAK`, `HOME`, and undeclared
  input did not reach the child. Preview emitted `[REDACTED]`.
- Empty boundary, invalid literal-secret, missing required input, recovery, child exit, and
  execution failure were exercised. Exits were 65 (invalid), 66 (missing), 0 (recovered), 23
  (child), and 70 (execution). Invalid and execution diagnostics did not echo test secrets.

### Live identity, browser policy, and privacy

- Live root, policy pages, JavaScript, CSS, WebPs, favicon, service worker, robots, and
  sitemap matched `dist/site` byte-for-byte. Root SHA-256:
  `3c3892179a53bae765c4ae3bd4f059961106b56b76646c4402b3215812796eaf`.
- `/`, `/privacy/`, and `/terms/` returned 200; unknown route returned 404; HTTP redirected
  to HTTPS. Root and worker were `no-cache, must-revalidate`; hashed JS was
  `public, max-age=31536000, immutable`; conditional requests returned 304.
- Root, assets, and worker had same-origin CSP, restrictive Permissions-Policy, HSTS,
  `Referrer-Policy: same-origin`, and `X-Content-Type-Options: nosniff`.
- Desktop 1440×900 and mobile 390×844 had no console/page errors, failed requests, overflow,
  cookies, localStorage, sessionStorage, or IndexedDB. Runtime requests stayed same-origin.
- Root, privacy, and terms had zero serious/critical axe findings on both viewports. Desktop
  keyboard focus reached a visible 3 px skip-link outline; proofreader invalid/recovery paths
  worked. Reduced motion set scrolling to `auto`; offline reload preserved the h1 and showed
  the offline status. `registration.update()` completed against the live versioned worker.

### Performance

- Initial JS 4,471 B, CSS 12,474 B, desktop WebP 76,962 B, mobile WebP 25,452 B, and no font
  payload all pass stated budgets.
- Fresh mobile Lighthouse: Performance **99**, Accessibility **100**, Best Practices **100**,
  SEO **100**; FCP 1.6 s, LCP 1.7 s, TBT 20 ms, CLS 0.

## Coverage boundary

CLI execution and packaging were native Linux checks. Windows/macOS behavior was not run on
native hosts. No publishing, deployment, infrastructure, or product-code changes were made.
