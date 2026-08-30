# Independent verification report — FAIL

**Work order:** `clean-env-runner-verify-4`  
**Candidate:** `37dc3dd1ae375c8fcba9ddd188e98b00b0f5750c` (`main`)  
**Verified URL:** <https://clean-env-runner.sociobot.in/>  
**Date:** 2026-08-30 UTC

## Verdict

**FAIL.** The packed CLI performs the researched job, the first-read/demo gate passes, all
behavioral claims pass against a built artifact, and production is byte-identical to the
candidate. The candidate nevertheless misses the explicit claims acceptance contract in two
ways: both Playwright claim commands fail from a clean installed checkout because their
preview server assumes an absent `dist/`, and the landing page makes an unlisted, false
absolute claim that the site uses no browser storage while its service worker writes eight
files to Cache Storage.

## Release-blocking defects

### High — two exact claim commands fail from a clean installed checkout

After `npm ci` in the clean candidate checkout, with no `dist/` present, each exact command
from `.factory/claims.json` failed:

```text
npx playwright test --grep='@claim:browser-local-only'
npx playwright test --grep='@claim:offline-reload'
Error: Timed out waiting 60000ms from config.webServer.
```

`playwright.config.js` starts `npm run preview`, which invokes `vite preview`; that server
requires a pre-existing production build. The claim entries do not build the site and the
normal `npm test` gate does not run Playwright. This violates the work order's requirement
that every listed claim test run from the clean clone; any failing claim test is explicitly
release-blocking.

After the independent `npm run build`, both exact commands passed in desktop and 390 px
projects (2/2 each). The claimed behaviors are sound; the defect is that the recorded claim
tests are not independently runnable from their stated clean state. Make each browser claim
command build its demo artifact, or configure its server to serve a clean checkout directly.

### Medium — “No browser storage” is false and is absent from the claims manifest

The first screen states **“No browser storage or analytics.”** A fresh production browser
context registered the service worker and created Cache Storage
`clean-env-runner-921216957772` containing eight URLs: root, `index.html`, two WebPs, favicon,
touch icon, the hashed JavaScript, and the hashed CSS. This storage is required for the
site's valid offline feature. The privacy page correctly says the service worker caches the
site shell, making the absolute landing statement internally inconsistent.

The closest manifest entry, `browser-local-only`, promises that the demo stores **no user
data**. Its test checks cookies, local/session storage, IndexedDB, and outbound requests, but
does not test the stronger “No browser storage” wording. This is therefore both an unlisted
claim and a claim disproved by the browser. Replace it with precise wording such as “No user
data stored or analytics,” then keep the existing offline-cache disclosure and test.

## Mandatory first-read and demo result

**PASS.** A cold 1440×900 load showed, without scrolling:

- what it does: “Run commands without ambient credentials.”
- who it is for: developers who need a small, reviewable local-command environment.
- what to do first: “Try it with sample data,” with “Loads a safe manifest. Nothing is
  saved” beside it.

One click opened `/?demo=1#proofreader`, changed the title to `Demo — Clean Env Runner`, and
showed a populated three-variable audit. The persistent banner said “Demo — sample manifest,
nothing is saved” and offered working **Reset demo** and **Start for real** controls. Reset
restored the sample; Start for real discarded the demo state and returned to `/#install`.

## Claims results

- The nine Node claim commands passed exactly: explicit boundary, receipt redaction, literal
  secret refusal, CLI demo, JSON output, stable exits, MIT license, single binary, and
  response policy.
- `browser-local-only` and `offline-reload` failed before a build as described above.
- After `npm run build`, each browser claim passed in both Chromium projects. The live
  production run also passed both projects.
- The browser trace confirmed that edited probe text was absent from all requests, all
  requests were same-origin GETs, cookies/localStorage/sessionStorage/IndexedDB remained
  empty, and edited manifest text disappeared on reload.

## Passing evidence

### Clean checkout, gates, and build

- Started clean at the requested SHA, matching `origin/main`.
- `npm ci` installed 21 packages; `npm audit --audit-level=low` found 0 vulnerabilities.
- `npm test` passed 6 Rust unit tests, 9 CLI integration tests, and 16 Node site/claim/release
  tests.
- `cargo fmt --check` and
  `cargo clippy --all-targets --all-features -- -D warnings` passed. There is no repository
  TypeScript or JavaScript lint/typecheck script.
- Exact `npm run build` and `npm run test:release` passed and produced `dist/bin/clean-env`
  plus `dist/site/`.
- Local and production `npm run test:e2e` each passed 18/18 tests across desktop Chromium and
  390×844 mobile.

### Packed CLI and end-to-end behavior

- `cargo package --locked` verified 11 intended files, 57.1 KiB unpacked and 15.7 KiB
  compressed. Installing the unpacked crate into a fresh root produced `clean-env 0.1.1`
  with demo, init, preview, check, and run in help.
- The installed `clean-env demo --output <empty-directory>` ran the real boundary, wrote the
  bundled manifest and scrubbed receipt, excluded ambient probes, and refused reuse of the
  non-empty demo directory with exit 65.
- A normal consumer run exposed exactly `PATH`, Unicode `PUBLIC`, secret `TOKEN`, and an
  intentionally present-but-empty `OPTIONAL`; undeclared `HOME` and ambient probes were
  absent. Preview/check/run JSON parsed correctly.
- A secret embedded in the working-directory path was replaced with `[REDACTED]`; no tested
  secret or ambient value appeared anywhere in the receipt, preview, check output, receipt
  diagnostics, or execution-error diagnostics.
- Empty environment, missing required input and recovery, literal secret, ambiguous source,
  unknown field, missing manifest, invalid CLI use, execution failure, init overwrite, and
  child failure were exercised. Observed exits were 64, 65, 66, 70, and preserved child 23.
- Five fresh `env -i` runs produced the identical three-variable environment: 5/5 (100%),
  exceeding the brief's 80% pilot success measure.

### Deployment identity, privacy, PWA, accessibility, and UX

- The factory URL verifier returned 200 in 566 ms with title, `lang=en`, one H1, main
  landmark, complete image alt text, labeled buttons, and no console/page errors.
- All 13 deployable public files matched the rebuilt candidate byte-for-byte. Root SHA-256:
  `106f3273abcbdfd90b026ddec0d3a90fa33a17367f5d33de9032ee2c658ffe6f`;
  worker SHA-256:
  `d1465e9688fea3720ad997a9a1c403e462f2fa1fab00555c46c62a209e951e10`.
- Root, privacy, and terms returned 200; an unknown route returned the designed 404; HTTP
  redirected to HTTPS. Every discovered internal and GitHub link returned 200.
- Root/policy HTML and `sw.js` sent `no-cache, must-revalidate`; hashed JS/CSS and WebPs sent
  `public, max-age=31536000, immutable`; conditional requests returned 304.
- HTML, assets, images, and worker sent restrictive same-origin CSP and Permissions-Policy,
  HSTS, `Referrer-Policy: same-origin`, and `X-Content-Type-Options: nosniff`.
- Desktop and 390 px mobile had no overflow, failed requests, page errors, or console errors.
  Every visible mobile action measured at least 44 px in each dimension where applicable.
- Keyboard traversal reached all controls without a trap; focus used a visible 3 px
  proof-red outline. Empty, invalid, and recovered proofreader states worked by keyboard.
- Axe found zero serious/critical issues on root, privacy, terms, and 404 in desktop and
  mobile contexts. Reduced motion changed smooth scrolling to `auto` and transitions to
  `0.01ms`. A 200% narrow-layout simulation retained all text, the primary action, and editor.
- The service worker update check passed, used one versioned cache, removed stale versions,
  and supported an offline reload with the guide and sample manifest intact.

### Performance and metadata

- Initial JavaScript is 4,987 B raw / 2,375 B gzip; CSS is 14,467 B raw / 3,740 B gzip;
  desktop/mobile hero WebPs are 76,962 B and 25,452 B; no fonts are downloaded. All budgets
  pass.
- Live mobile Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.02 s, LCP 1.08 s, TBT 1 ms, CLS 0, Speed Index 1.02 s, no warnings. Lab
  Lighthouse did not report INP.
- Root, privacy, terms, and 404 have route-specific titles under 60 characters, descriptions
  under 155 characters, canonicals, one H1, ordered headings, favicon/touch icon, and painted
  theme color. Root and policy pages provide the product social card.

## Applicability and coverage boundary

This is a static site plus local CLI: it has no server-side product/unlock endpoint, account,
or sign-in flow, so API allowance/429 and Entra checks do not apply. No AI feature is present
or warranted by the brief. CLI execution was native Linux; Windows/macOS branches were
reviewed but not run on native hosts. No registry publication, deployment, infrastructure, or
product-code change was made.
