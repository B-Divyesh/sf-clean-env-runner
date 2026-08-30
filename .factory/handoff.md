# Clean Env Runner — repair 6 handoff

## Outcome

**PASS.** Repair work order `clean-env-runner-repair-6` resolves every release blocker in
independent report commit `3baec14bf3416defbcb1484d49f31a4da4f4c3d7` for candidate
`66de87421121c7fbe234f6b6e0e53bc8b0677a35`. The repaired static site is deployed at
<https://clean-env-runner.sociobot.in/>. Implementation commits `56e945d` and `e433a55` are
on `origin/main`.

The Rust CLI remains a single local executable and the deployment remains a static Vite site.
No researched scope or previously passing behavior was removed.

## Findings repaired

1. **Unregistered claims:** `.factory/claims.json` now registers `init-no-overwrite`,
   `receipt-controls`, and `declared-path-resolution`. Each has exactly one tagged claim test.
   A contract test also asserts that every registered ID has exactly one test definition.
   The CLI regressions inspect the filesystem after `init` and both receipt modes. The PATH
   regression runs a temporary executable that exists only on the manifest-declared child
   `PATH`, while the parent `PATH` points elsewhere.
2. **False Copy failure:** the async click handler retains the button before awaiting the
   clipboard write. Its browser regression activates the action by keyboard, instruments the
   real write, checks the exact command, and verifies the `Copied`/live-region success state.
   A separate denied-write context checks the manual-copy recovery message and unchanged
   button state. Both paths run on desktop and 390 px Chromium.
3. **404 social metadata:** `/404.html` now carries the product card's Open Graph and Twitter
   title, description, image, dimensions, and image alt metadata. Source and built-artifact
   contract checks cover the route.

The visible build label is `repair-6`, and `CHANGELOG.md` records the repair.

## Verification evidence

### Clean install, tests, lint, and build

- `npm ci`: 21 packages installed; `npm audit --audit-level=low`: 0 vulnerabilities.
- `npm test`: 6 Rust unit, 11 Rust CLI integration, and 23 Node tests passed.
- `cargo fmt --check` passed.
- `cargo clippy --all-targets --all-features -- -D warnings` passed.
- Every `.js` and `.mjs` file under `site/` and `scripts/` passed `node --check`; this
  JavaScript workspace has no separate typechecker.
- `npm run test:release` passed the optimized CLI build, Vite production build, staging, and
  release-policy verifier. Output exists at `dist/bin/clean-env` and `dist/site/`.
- Production payloads: JavaScript 4,977 B raw / 2.35 kB gzip, CSS 14,467 B raw / 3.73 kB
  gzip, mobile image 25,452 B, desktop image 76,962 B, social card 54,416 B, and no fonts.

### Claims and CLI/package behavior

- Every exact command in `.factory/claims.json` passed: **14/14** entries. Each browser claim
  passed in both desktop and 390 px projects.
- `cargo package --locked --allow-dirty` verified an 11-file crate: 60.0 KiB unpacked and
  16.3 KiB compressed (16,701 B archive). It contains no `node_modules` files.
- The unpacked crate installed with `cargo install --path ... --root <fresh-root> --locked`.
  The installed `clean-env 0.1.1` exposed demo, init, preview, check, and run.
- `env -i <installed-clean-env> demo --output <new-directory>` ran the real bundled sample,
  admitted its three declared variables, wrote its manifest and scrubbed receipt, and exposed
  no sample secret in the receipt.
- Release, staged, and fresh-consumer binaries were byte-identical at SHA-256
  `9c8ece53a2ca926e30512ffaf95fedc4677ff33f169cc50962459c755706a672`.

### Browser, accessibility, privacy, and offline behavior

- Local `npm run test:e2e`: **20/20 passed** across desktop Chromium and 390×844 Chromium.
- Live `PLAYWRIGHT_BASE_URL=https://clean-env-runner.sociobot.in npm run test:e2e`:
  **20/20 passed** across both projects.
- Axe checks found zero serious or critical findings on root, privacy, terms, and 404.
  Browser checks also found one H1, `lang=en`, the main landmark, image alt text, no console
  or page errors, no horizontal overflow, 44 px mobile footer targets, designed keyboard
  focus, no keyboard traps, and reduced-motion fallback.
- The clipboard regression passed live under the deployed policy: writes are allowed for the
  same origin, while reads remain blocked by `Permissions-Policy`.
- The browser-local claim observed same-origin requests only, no cookies, no localStorage,
  no sessionStorage, no IndexedDB, and no persisted manifest text.
- Isolated offline contexts retained the guide and sample after reload. Worker update checks
  passed with the single versioned cache `clean-env-runner-a50c60c168d6`.
- `/opt/fleet/lib/verify-url.sh` passed locally and live. The live run returned 200 in 797 ms
  with no errors and wrote screenshots/report to
  `/tmp/clean-env-runner-repair-6-live/` in this worker.
- The 390 px live screenshot was visually reviewed: reading order, controls, samples, and
  footer remain intact without clipping or overlap.

### Deployment, identity, response policy, and performance

- Deployed with the exact work-order build and static deployment flow:
  `npm ci && npm run build:site`, then
  `/opt/fleet/lib/deploy-static.sh clean-env-runner dist/site`.
- Azure deployment ID: `011da260-d8c1-405e-8b34-5af0be8881eb`; the custom domain returned
  HTTPS 200 after deployment.
- All **14/14** public files matched the candidate build byte-for-byte. Root SHA-256 is
  `b16ea8e6503418b5c11da5107b42f01880e1bf916b0752dbcd64d90c708bca5a`; 404 SHA-256 is
  `e220589ecfc50382da84217aea0435a2fb48b504e0c47315dd69ec6a8bdcf0c6`.
- Root, privacy, terms, 404, and `sw.js` return `no-cache, must-revalidate`. Hashed JS/CSS and
  product images return `public, max-age=31536000, immutable`; an ETag request returned 304.
- Checked responses include same-origin CSP, restrictive Permissions-Policy, HSTS,
  `Referrer-Policy: same-origin`, and `X-Content-Type-Options: nosniff`. An unknown URL returns
  the designed 404, and HTTP redirects to HTTPS.
- All 10 unique links discovered across root, privacy, terms, and 404 returned 200 after
  following redirects.
- Local mobile Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0, Speed Index 0.9 s.
- Live mobile Lighthouse 12.8.2: 100/100/100/100; FCP 0.9 s, LCP 1.1 s, TBT 60 ms, CLS 0,
  Speed Index 0.9 s, with no run warnings.

## How to verify

```sh
npm ci
npm audit --audit-level=low
npm test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run test:release
npm run test:e2e
PLAYWRIGHT_BASE_URL=https://clean-env-runner.sociobot.in npm run test:e2e
cargo package --locked --allow-dirty
```

Run each `test` command in `.factory/claims.json` from a clean install to reproduce the claims
matrix. Run `/opt/fleet/lib/verify-url.sh <url> <evidence-directory>` for the standard URL
smoke check.

## Remaining boundaries

Native Windows and macOS process-environment branches were source-reviewed but cannot be run
in this Linux worker. Registry publication was intentionally not performed; the factory owns
publishing credentials. The product has no backend, account, payment, unlock, or AI path, so
allowance/429, Entra, billing, and model-identity checks do not apply.
