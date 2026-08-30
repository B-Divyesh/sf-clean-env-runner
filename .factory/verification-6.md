# Independent verification report — FAIL

**Work order:** `clean-env-runner-verify-6`  
**Candidate:** `aeee6edda3c5d4fcc2fe6646225a4e7a67f6abf9` (`main`)  
**Verified URL:** <https://clean-env-runner.sociobot.in/>  
**Date:** 2026-08-30 UTC

## Verdict

**FAIL.** The deployed site is byte-identical to the candidate, the CLI completes the
researched job, and every declared claim passes after dependency installation. Release
acceptance is nevertheless blocked by the required first clean-clone claims run, incomplete
claim coverage, and undersized interactive targets. These are fresh repository/product
findings, not a deployment-only failure.

## Release-blocking defects

### High — two declared claim commands fail in the required untouched-clone run

The first QA action was to validate `.factory/claims.json` and execute every listed `test`
command exactly as written, before dependency installation or broader inspection. Twelve
commands passed. Both browser commands failed before executing an assertion:

```text
npx playwright test --grep='@claim:browser-local-only'
npx playwright test --grep='@claim:offline-reload'

Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@playwright/test'
imported from /work/repo/playwright.config.js
```

The supplied acceptance contract says any failing claim test is release-blocking. After
`npm ci`, all 14 exact claim commands passed; each browser claim passed in desktop and 390 px
Chromium. That confirms the features work in an installed checkout, but it does not change the
mandatory first-run result.

### High — public promises remain outside the claim inventory or lack complete claim tests

The claims contract requires every testable promise to appear in `.factory/claims.json` with
one tagged observable test. The candidate repaired the three examples from verification 5,
but its public copy still exceeds the 14-entry inventory. Concrete examples:

- The first screen and README promise **Rust 1.85+** compatibility. No claim entry or tagged
  test names or runs that toolchain. Independent verification with Rust 1.85.0 passed, but an
  ad hoc verifier check is not the required product claim test.
- The privacy page promises that **non-secret literal values are not stored in receipts**.
  The `receipt-secret-redaction` claim and its tagged test cover declared secret values, not
  this separate non-secret-value promise.
- The README publishes the full exit-code contract (`0`, `64`, `65`, `66`, `70`, and the
  child's status). `stable-exits` lists and asserts only missing input `66` and child-status
  preservation.
- `init-no-overwrite` says replacement happens when explicitly requested, but its sole tagged
  test checks only refusal and byte preservation. It never exercises `init --force` or proves
  replacement.

The behavior inspected is generally present, but the required claim inventory and observable
tagged coverage are incomplete.

### Medium — visible links miss the required 44×44 px target size

Fresh Chromium measurements found interactive targets below the attached accessibility and
design baseline:

- Desktop primary-nav **Demo**: `30.73×44` px on root, privacy, terms, and 404.
- Desktop primary-nav **Terms**: `38.41×44` px on privacy.
- Policy-body links are as short as `109.59×17` px; the mobile Terms page has the same
  `109.59×17` px source-repository link and a `103.5×22` px MIT License link.

All visible controls on the mobile root/demo were at least 44×44 px, and axe did not report
these target-size misses. The explicit factory contract is stricter and requires every
interactive target to meet 44×44 px.

## Mandatory first-read and demo result

**PASS.** A cold 1440×900 live load states all three required points in plain words:

- What: “Run commands without ambient credentials.”
- Who: “For developers who need local commands to use a small, reviewable environment.”
- First action: “Try it with sample data,” followed by “Loads a safe manifest. Nothing is
  saved.”

One click opened `/?demo=1#proofreader`, changed the title to `Demo — Clean Env Runner`,
loaded a realistic three-variable manifest and audit, and showed the persistent demo banner
with **Reset demo** and **Start for real**. The 390×844 first viewport also contained the job,
audience, three facts, primary demo action, and install command without clipping.

## Passing evidence

### Clean install, tests, checks, and exact build

- The checkout began clean at the requested SHA, which also matched `origin/main`.
- `.factory/claims.json` exists, is valid JSON, and contains 14 structurally complete entries.
- `npm ci` installed 21 packages; `npm audit --audit-level=low` found zero vulnerabilities.
- Post-install claim matrix: **14/14 passed**; the two Playwright entries each passed 2/2
  across desktop and mobile.
- `npm test`: 6 Rust unit tests, 11 CLI integration tests, and 23 Node tests passed.
- `cargo fmt --check`, Clippy across all targets/features with warnings denied, and `node
  --check` over all repository JavaScript passed. No separate JS lint/typecheck script exists.
- `cargo +1.85.0 check --locked` and `cargo +1.85.0 test --locked` passed after installing the
  declared minimum toolchain.
- `npm run test:release` passed the exact optimized build, site build, CLI staging, and release
  artifact verifier. It produced `dist/bin/clean-env` and `dist/site`.
- Local and live Playwright suites each passed **20/20** in desktop and 390×844 Chromium.

### Clean consumer and CLI behavior

- `cargo package --locked --allow-dirty` verified an 11-file crate: 60.0 KiB unpacked and
  16.3 KiB compressed. It contains README, LICENSE, CHANGELOG, example, sources, and tests;
  it contains no workspace `node_modules` content.
- Installing the unpacked crate into a fresh root yielded the single `clean-env 0.1.1`
  executable. The documented `cargo install --git ...` command independently installed commit
  `aeee6edd` and its bundled demo completed.
- Release, staged, and clean-consumer binaries were byte-identical at SHA-256
  `9c8ece53a2ca926e30512ffaf95fedc4677ff33f169cc50962459c755706a672`.
- The packaged demo created a new directory, wrote its manifest and scrubbed receipt, printed
  the location, admitted exactly `CI`, `DEPLOY_TOKEN`, and `PROJECT`, and excluded an injected
  ambient marker. Reusing the directory returned 65 with recovery guidance.
- Preview/check JSON parsed and showed the secret as `[REDACTED]`; the known QA secret was
  absent from receipt and diagnostic files. Missing input returned 66 and succeeded when
  supplied. Invalid CLI use returned 64, a missing executable returned 70, and child exit 23
  was preserved.
- Five isolated `env -i` runs produced the same three-variable output hash: 5/5 reproducible,
  exceeding the brief's 80% target.
- Automated CLI coverage also passed empty-boundary, literal-secret refusal, receipt
  disable/redirect, declared-child-PATH resolution, invalid manifest, and secret-bearing path
  redaction cases.

### Live identity, privacy, security, and routing

- All **14/14** deployable public files matched the candidate build byte-for-byte. Root
  SHA-256 was `b16ea8e6503418b5c11da5107b42f01880e1bf916b0752dbcd64d90c708bca5a`;
  404 SHA-256 was `e220589ecfc50382da84217aea0435a2fb48b504e0c47315dd69ec6a8bdcf0c6`.
- `/opt/fleet/lib/verify-url.sh` returned live HTTP 200 in 765 ms with the expected title,
  `lang=en`, one H1, main landmark, image alt text, labeled buttons, and no console errors.
- Fresh desktop/mobile demo request logs contained only same-origin HTML, hashed JS/CSS, and
  the responsive product image. A unique edited-manifest marker appeared in no URL. Cookies,
  localStorage, sessionStorage, and IndexedDB remained empty; only the disclosed versioned
  same-origin shell cache existed.
- Root, privacy, terms, 404, worker, assets, and images sent the restrictive same-origin CSP,
  Permissions-Policy, HSTS, `Referrer-Policy: same-origin`, and `nosniff`.
- HTML and `sw.js` sent `no-cache, must-revalidate`; hashed JS/CSS and WebP images sent
  `public, max-age=31536000, immutable`; an ETag revalidation returned 304.
- The root, demo, privacy, terms, 404, and unknown-route metadata had the required title,
  language, one H1, main landmark, description, canonical, and social card. The unknown URL
  returned the designed 404 body with HTTP 404. HTTP redirected to HTTPS.
- All 13 unique discovered links returned 200 after redirects.
- There are no runtime third-party URLs, source maps, tracked credential-like files, account,
  sign-in, payment, AI, unlock, or product API paths. API allowance/429 and Entra checks are
  therefore not applicable.

### Accessibility, mobile, offline, and performance

- Axe found zero serious or critical findings on root, privacy, terms, and 404 across desktop
  and mobile. Browser suites and independent smoke tests found no console or page errors.
- The demo's valid, empty, invalid, reset, copy-success, and clipboard-denied paths worked by
  keyboard. Tab traversal reached every root control, started with the skip link, showed a
  3 px proof-red focus outline, and returned to the document without a trap.
- Desktop and 390 px layouts had no horizontal overflow. Invalid manifest feedback named the
  problem and next action. Reduced motion changed smooth scrolling to `auto` and transitions
  to effectively zero.
- Service-worker update, one versioned cache, and isolated offline reload all passed; the
  guide and sample remained usable offline.
- Initial app JavaScript is 4,977 B raw / 2,376 B gzip; CSS is 14,467 B raw / 3,735 B gzip;
  mobile hero 25,452 B; desktop hero 76,962 B; no fonts. All supplied bundle budgets pass.
- Live mobile Lighthouse 12.8.2 scored Performance 100, Accessibility 100, Best Practices
  100, and SEO 100. FCP was 1.14 s, LCP 1.15 s, TBT 54.5 ms, CLS 0, and Speed Index 1.14 s,
  with no run warnings. Lab Lighthouse did not provide INP.

## Applicability and remaining boundaries

This is a static documentation/demo site plus a local CLI, not a backend. Native Linux
execution was tested. Windows and macOS branches were source-reviewed but not run on native
hosts. Registry publication was intentionally not performed.

## Required remediation

1. Make every exact claims command runnable under the mandated clean-clone ordering, then
   preserve the post-install matrix.
2. Inventory or remove all remaining public promises, and make each tagged claim test assert
   the whole promise, including `init --force` if that exception remains in the claim.
3. Expand the clickable area of all visible links to the required 44×44 px minimum, then add
   full-route desktop/mobile target-size coverage rather than checking footer links alone.
