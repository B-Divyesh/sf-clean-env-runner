# Verification report — FAIL

**Work order:** `clean-env-runner-verify-1`  
**Candidate:** `c70b9dbc04a41eb1890907c69f237f7012ed5ba5` (`main`)  
**Verified URL:** <https://clean-env-runner.sociobot.in/>  
**Date:** 2026-08-28 UTC

## Verdict

**FAIL.** The core CLI, package, offline site, accessibility baseline, and live/candidate
content match all passed. The candidate does not meet the factory completion contract because
it has neither `/privacy` nor `/terms` despite writing local run receipts, and the deployed
hashed assets have neither immutable long-lived caching nor browser hardening policies.

## Defects

### Medium — required privacy and terms pages are absent

The CLI writes local JSON receipts by default (`.clean-env/receipts/<id>.json`) containing
the command, working directory, timestamps, and environment-variable names/sources. The
product contract requires `/privacy` and `/terms` for products that store user data. The
production paths `/privacy` and `/terms` fall back to the site HTML rather than serving
policy pages; neither page exists in the production artifact.

**Impact:** a user has no published statement of the receipt data retained locally or its
handling, and the explicit documentation quality gate is unmet.

### Medium — production cache policy misses the static-product requirement

At 2026-08-28 02:53 UTC, `HEAD` responses for both hashed production assets returned
`cache-control: public, must-revalidate, max-age=30`:

- `/assets/index-BamwLrDv.js` (4,443 B)
- `/assets/index-D-izb9H3.css` (11,911 B)

The factory performance contract requires long-lived immutable caching for hashed assets.
The same short cache policy is served for the WebP and service-worker assets.

### Medium — production response hardening is incomplete

The live HTML, JS, CSS, image, and service-worker responses include HSTS, a referrer policy,
and `X-Content-Type-Options: nosniff`, but omit both `Content-Security-Policy` and
`Permissions-Policy`. This is particularly relevant to a security-oriented developer tool
whose site executes browser JavaScript and registers a service worker.

## Evidence of passing checks

### Clean checkout, build, and package

- Checkout was clean at the requested SHA before verification.
- `npm ci` completed with **0 vulnerabilities** reported by npm audit.
- `npm test` passed: 4 Rust unit tests, 4 Rust CLI integration tests, and 3 site unit tests.
- `npm run test:e2e` passed: **6/6** Playwright tests across desktop Chromium and the
  390×844 mobile profile.
- `cargo clippy --all-targets --all-features -- -D warnings` and `cargo fmt --check` passed.
- Exact production build `npm run build` passed and produced `dist/bin/clean-env` and
  `dist/site/`.
- `cargo package --allow-dirty` packaged and verified 46 files (233.1 KiB uncompressed,
  66.8 KiB compressed). The `.crate` was unpacked and installed with `cargo install --path
  <unpacked-crate> --root <clean-temp-root> --locked`; its public binary returned
  `clean-env 0.1.0`, validated a manifest, exposed only declared values, and excluded an
  injected `AMBIENT_LEAK` variable.

### CLI end-to-end and recovery

Using the release `dist/bin/clean-env` in an isolated temporary consumer directory:

- `init` created the starter manifest; a second `init` refused overwrite with exit 65.
- A manifest with literal `PUBLIC`, explicit child `PATH`, and secret `TOKEN` from
  `SOURCE_TOKEN` produced only `PATH`, `PUBLIC`, and `TOKEN` in the child. An ambient
  `AMBIENT_SHOULD_DISAPPEAR` value was absent.
- Preview rendered the secret as `[REDACTED]`; the receipt did not contain the known secret.
  It recorded `source=env:SOURCE_TOKEN`, `secret=true`, and no values.
- An empty manifest ran `/usr/bin/env` with **0 output bytes**.
- Missing required input returned exit 66 with recoverable JSON preview data. Literal secret
  and ambiguous-source manifests returned exit 65 and did not expose the literal secret.

### Browser, accessibility, privacy, and PWA behavior

- Desktop and 390 px mobile: no overflow, all measured buttons at least 44 px high, one h1,
  `lang=en`, title, main landmark, meaningful image alt, and a visible 3 px proof-red keyboard
  focus outline.
- Keyboard activation exercised empty-boundary, broken-secret, and valid-recovery states.
- Local and live axe scans had **zero serious/critical violations**. Local and live browser
  tests recorded no page errors or console errors.
- Live mobile network requests used only `https://clean-env-runner.sociobot.in`; there were no
  runtime third-party, analytics, font, or telemetry requests. The site proofreader is
  local/browser-only.
- Reduced-motion evaluation changed document scrolling from `smooth` to `auto`.
- The service worker became active and a cached local offline reload returned 200 with the
  expected h1 and no errors.

### Budgets and live identity

- Production artifact payloads: initial JS 4,443 B, CSS 11,911 B, desktop WebP 76,962 B,
  mobile WebP 25,452 B, no font payload. These are within the stated size budgets.
- Mobile Lighthouse against the exact local production build reported Performance **100** and
  Accessibility **100**; FCP 989 ms, LCP 1,075 ms, TBT 55 ms, CLS 0. The Chromium process
  crashed while Lighthouse collected the final screenshot after scores were generated, so no
  Best Practices/SEO score is claimed from this run.
- The live HTML SHA-256 is
  `0dfab067e2940c30c92e9b055e3c7be6bb7ec7dca3f3d60ddfa068aeaf3702d3`, identical to
  `dist/site/index.html` rebuilt from the candidate. Live asset names also match the candidate
  (`index-BamwLrDv.js`, `index-D-izb9H3.css`).

## Required remediation and re-verification

1. Add actual `/privacy` and `/terms` pages that accurately describe local receipt data and
   the absence of tracking/network collection.
2. Configure the static deployment so content-hashed assets have long-lived immutable cache
   headers, while HTML and `sw.js` remain revalidatable for updates.
3. Add an appropriate CSP and restrictive Permissions-Policy at the deployment edge, then
   re-run live header and PWA update checks.
