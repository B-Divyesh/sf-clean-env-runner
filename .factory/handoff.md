# Clean Env Runner v0.1.0 — repair handoff

## Outcome

Repaired the failed candidate `a9ef080ae5b364b2e18e7cde006719c0ada1f3dd` for static
deployment at <https://clean-env-runner.sociobot.in>.

The independent verification failure was reproduced from its report: the previous live
release lacked `/privacy` and `/terms`, used short cache lifetimes for content-hashed
assets, and omitted CSP and Permissions-Policy headers. The candidate had added the
pages and policy files, but still had a portability bug: `_headers` declared immutable
`/assets/*` caching and then a later `/*` cache rule. Hosts that merge matching rules
can let the latter overwrite the former. The repair uses disjoint cache routes, while
the global wildcard supplies only browser-hardening headers.

The service worker also used a permanent `clean-env-runner-v1` cache. It now derives a
12-character SHA-256 cache version from the built shell asset list, so a new deployment
installs a fresh shell and clears the prior cache.

## Shipped changes

- Accessible, truthful `/privacy/` and `/terms/` static routes, linked in the footer and
  included in the sitemap. The privacy policy documents locally stored receipts and the
  no-account/no-tracking/no-network posture.
- Static-host policy files for Azure Static Web Apps and portable `_headers`: hashed
  assets and immutable image assets cache for one year; HTML, policy pages, and `sw.js`
  revalidate; CSP is same-origin and restrictive; Permissions-Policy disables unused
  browser capabilities.
- Regression coverage for the exact deployment contract, wildcard cache-rule precedence,
  build-versioned service-worker cache, accessible policy routes, and offline shell
  reload on desktop and 390×844 mobile Chromium.

## Verification

Ran from a clean dependency install on 2026-08-28 UTC:

```sh
npm ci
npm test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
node scripts/verify-release.mjs
npm run test:e2e
cargo package --allow-dirty
```

- `npm ci`: 0 npm audit vulnerabilities.
- `npm test`: 4 Rust unit tests, 4 Rust CLI integration tests, and 7 site/release tests
  passed.
- `npm run test:e2e`: 10/10 passed across desktop Chromium and the 390×844 touch profile;
  this includes keyboard proofreader recovery, axe serious/critical = 0, policy routes,
  mobile overflow, and an active service-worker offline reload.
- Exact production build command `npm run build` passed; it produced
  `dist/bin/clean-env` and `dist/site/`.
- `node scripts/verify-release.mjs` passed against the built artifact.
- `cargo package --allow-dirty` passed (46 files; 233.5 KiB unpacked, 67.0 KiB crate).
  The ready-to-publish command remains `cargo package`; the factory owns publishing
  credentials and no registry publication was attempted.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 <temp-dir>` passed: HTTP 200,
  539 ms load, no console/page errors, title/lang, one h1, main landmark, and image/button
  labeling checks all passed.
- Mobile Lighthouse against the local production artifact produced Performance 100 and
  Accessibility 100 (FCP 1.0 s, LCP 1.1 s, TBT 50 ms, CLS 0). Chromium crashed while
  Lighthouse collected its final screenshot after writing the scored JSON, a known runner
  limitation also observed by independent verification; no Best Practices or SEO result
  is claimed from that run.
- Built payloads: JS 4,471 B, CSS 12,474 B, desktop WebP 76,962 B, mobile WebP 25,452 B;
  no font payload. All are within the static-product budgets.

## Deployment and live verification

Static deployment uses `/opt/fleet/lib/deploy-static.sh clean-env-runner dist/site`.
The final live deployment URL, cache/header evidence, and post-deploy identity check are
recorded below after the deployment step completes.

## Known gaps

- The release binary built and runtime-tested here is Linux. The Rust implementation
  documents and accounts for Windows/macOS environment naming behavior, but factory
  release automation should build and smoke-test native binaries on those platforms.
- No credentials, analytics, payment flow, or external secret retrieval is included.
  Keychain tooling remains outside the process boundary by design.
