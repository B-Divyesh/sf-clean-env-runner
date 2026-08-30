# Clean Env Runner — independent verification 5 handoff

## Outcome

**FAIL.** Candidate `66de87421121c7fbe234f6b6e0e53bc8b0677a35` was independently
verified against <https://clean-env-runner.sociobot.in/> on 2026-08-30 UTC. The deployment is
healthy and byte-identical to the candidate, all 11 registered claims pass after `npm ci`, and
the CLI completes the researched job. Release acceptance is blocked by incomplete claim
registration and a broken success state on the live Install **Copy** action. No product code
was changed.

Full evidence and reproduction details are in `.factory/verification-5.md`.

## Defects by severity

1. **High / release-blocking — unlisted public claims.** The landing/README promise, among
   other things, that `clean-env init` does not overwrite an existing manifest, that receipt
   writing can be disabled/redirected, and that bare commands resolve through the declared
   child `PATH`. None has a `.factory/claims.json` entry and exactly one tagged claim test as
   required by the attached acceptance contract.
2. **Medium — Copy reports failure after success.** In a permitted Chromium context, the
   clipboard write resolves, but the live page announces “Clipboard access was blocked” and
   leaves the button unchanged. `event.currentTarget` is accessed after `await`, when it is
   null, and the resulting exception is caught as a clipboard error.
3. **Low — 404 social metadata.** `/404.html` omits the Open Graph and Twitter card metadata
   required for routes by the site-structure contract.

## Verification summary

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

- Tests: 6 Rust unit + 9 Rust integration + 18 Node passed; local and live Playwright each
  passed 18/18 on desktop and 390 px mobile.
- Claims: final installed matrix 11/11 passed. The first pre-install attempt could not execute
  the two Playwright entries because `@playwright/test` was not yet installed; after the clean
  install, both passed 2/2.
- Build/package: exact release build and policy verifier passed. The 11-file crate installed
  into a fresh consumer; staged, release, and installed binary SHA-256 values matched.
- CLI: normal, empty, Unicode, optional-missing, invalid, missing-input/recovery, execution
  error, child-exit, receipt, no-receipt, and secret-redaction paths were exercised. Five clean
  shell runs reproduced identically.
- Browser: zero serious/critical axe findings, no console/page errors, same-origin-only request
  log, no user-data storage, correct security/cache headers, visible keyboard focus, 44 px
  mobile targets, reduced motion, worker update, and offline reload all passed.
- Deployment identity: all 14 public files matched the candidate build byte-for-byte.
- Live mobile Lighthouse: 100/100/100/100; FCP 1.06 s, LCP 1.07 s, TBT 14 ms, CLS 0.

## Next steps

Register or remove every unlisted landing/README claim, with one tagged observable test per
registered claim. Fix the async Copy handler by retaining the button before awaiting and test
success plus denied-permission recovery. Add the existing social-card metadata to the 404.
Then rerun the exact claims matrix before the broader gates.

Native Windows/macOS execution remains outside this Linux container. No server endpoint,
sign-in, payment, unlock, or AI flow exists, so allowance/429 and Entra checks are not
applicable. The package is ready to publish mechanically but was not uploaded.
