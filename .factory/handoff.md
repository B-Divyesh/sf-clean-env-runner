# Clean Env Runner v0.1.0 — verification handoff (FAIL)

## Verification outcome

**FAIL for candidate `c70b9dbc04a41eb1890907c69f237f7012ed5ba5` at
<https://clean-env-runner.sociobot.in/>.** Core CLI/site behavior, packaging, build, browser,
accessibility, and live/candidate identity passed. The release remains blocked by three
medium-severity acceptance defects: missing `/privacy` and `/terms` pages despite default
local receipt storage; live hashed assets cached only for 30 seconds rather than immutable;
and no live CSP or Permissions-Policy. Full evidence is in `.factory/verification.md`.

## What shipped

- A release-ready Rust single binary named `clean-env`, with a small `clap` surface:
  `init`, `preview`, `check`, and `run`.
- Strict TOML manifests whose `env` table is the complete child allowlist. Sources can
  be same-name inheritance, renamed parent input, or a non-secret literal. Invalid or
  ambiguous sources are rejected.
- Secret-name placeholders that refuse literal secret values, redact previews, and
  scrub matching command arguments before a receipt is written. The tool stores and
  fetches no credentials; OS-keychain injection remains outside the process boundary.
- A true cleared child environment (`Command::env_clear`), required-input checks,
  child exit-code propagation, stable CLI error codes, `--json` reporting, and JSON
  receipts containing manifest SHA-256/provenance but no secret values.
- Cross-platform naming rules and documentation for Linux, macOS, and Windows.
- A static landing/reference site in a product-specific monochrome broadsheet system,
  with a local-only manifest proofreader, valid/empty/error examples, keyboard paths,
  copy feedback, mobile layout, print styles, offline status, and a versioned service
  worker shell cache.
- One original AI-generated letterpress/environment-boundary hero, plus an optimized
  720 px derivative. Full prompt, generation route, and provenance are recorded in
  `.factory/design.md`.
- README-first usage documentation, MIT license, changelog, robots/sitemap, package
  metadata, and a ready-to-publish crate. Privacy/terms routes are intentionally not
  included because the product has no accounts, payment, storage, analytics, cookies,
  or network calls.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
cargo package --allow-dirty
```

- `npm test`: 8 Rust tests (including real child-process boundary/receipt tests) and
  3 browser-proofreader unit tests passed.
- `npm run test:e2e`: 6 Playwright checks passed across desktop Chromium and a
  390×844 mobile Chromium profile. Axe reported zero serious/critical findings; the
  suite also checks one h1, main/title/lang/alt basics, no console errors, keyboard
  operation, all proofreader states, and no document-level mobile overflow.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 <temp-dir>` passed: HTTP 200,
  527 ms local load, zero console errors, one h1, main present, no missing image alt,
  and no unlabeled buttons.
- Lighthouse 12.8.2 mobile result: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; LCP 1.3 s, FCP 1.0 s, TBT 0 ms, CLS 0.
- Production budgets: initial JS 4,443 B, CSS 11,911 B, desktop hero 76,962 B,
  mobile hero 25,452 B; no font payload and no runtime third parties.
- `npm audit --audit-level=high`: zero vulnerabilities.
- `cargo package --allow-dirty`: packaged and verified successfully. Publish later
  with `cargo publish` using factory-owned registry credentials; the worker did not
  publish.

## Artifacts and deployment

- Static deploy root: `dist/site/` (contains `index.html`).
- Staged host binary: `dist/bin/clean-env` (Linux container build, 994,312 B).
- Verified crate: `target/package/clean-env-runner-0.1.0.crate`.
- Exact full build command: `npm run build`.

## Known gaps / next steps

- Add real `/privacy` and `/terms` pages covering the local receipt data (command, working
  directory, timestamps, and variable provenance) and the no-tracking/no-network posture.
- Configure deployment headers: immutable long-lived caching for content-hashed assets;
  revalidation for HTML and `sw.js`; a restrictive CSP and Permissions-Policy. Re-run live
  verification after the deployment change.

- Only the Linux binary was produced and runtime-tested in this worker. The Rust code
  accounts for Windows case-insensitive environment names and uses portable process
  APIs, but release CI should compile and run smoke tests on Windows and macOS before
  attaching all three platform binaries.
- The crate and release binaries are intentionally not published; the factory owns
  registry credentials and release automation. Until then, the site uses the honest
  `cargo install --git …` installation command.
- Direct keychain retrieval is outside v1's non-goal of storing secrets. Documented
  OS keychain tools can inject a named parent variable, which `from_env` then admits
  without logging its value.
