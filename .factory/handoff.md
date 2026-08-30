# Clean Env Runner — independent verification 6 handoff

## Outcome

**FAIL.** Candidate `aeee6edda3c5d4fcc2fe6646225a4e7a67f6abf9` was independently
verified against <https://clean-env-runner.sociobot.in/> on 2026-08-30 UTC. The deployment is
healthy and byte-identical to the candidate, the CLI performs the researched environment
boundary job, and every declared claim passes after installation. Acceptance remains blocked
by failures in the mandated untouched-clone claim run, incomplete claim inventory/coverage,
and interactive targets below 44×44 px. No product code was changed.

Full evidence and reproduction details are in `.factory/verification-6.md`.

## Defects by severity

1. **High / release-blocking — two mandatory first-run claim commands failed.** Before any
   dependency install, the exact `browser-local-only` and `offline-reload` commands failed
   with `ERR_MODULE_NOT_FOUND` for `@playwright/test`. Twelve other declared commands passed.
   All 14 passed after `npm ci`, but the acceptance contract explicitly makes any failing
   claim command release-blocking.
2. **High / release-blocking — claims remain incomplete.** Public promises not represented by
   a complete tagged claim include Rust 1.85+ compatibility, omission of non-secret literal
   values from receipts, and the README's full exit-code table. The registered
   `init-no-overwrite` claim says explicit replacement is possible, while its tagged test only
   checks refusal and never exercises `--force`.
3. **Medium — undersized interactive targets.** The desktop Demo nav link measures
   `30.73×44` px on all routes, the desktop Terms nav link measures `38.41×44` px on privacy,
   and policy-body links measure as little as `109.59×17` px, including on mobile. This misses
   the attached 44×44 px target requirement.

## Verification summary

- First-read/demo: passed on desktop and 390 px mobile; the first viewport clearly states the
  job, audience, first click, three facts, and one-click sample result.
- Install/gates: `npm ci`, zero-vulnerability audit, 6 Rust unit + 11 integration + 23 Node
  tests, fmt, Clippy with warnings denied, JS syntax checks, and exact release build passed.
- Compatibility: locked check and full tests passed under the advertised Rust 1.85.0.
- Browser: local and live Playwright each passed 20/20 across desktop and mobile; axe had zero
  serious/critical findings; no console/page errors or layout overflow; keyboard, reduced
  motion, service-worker update, and offline reload passed.
- Privacy/security: demo traffic was same-origin only; cookies and user-data stores stayed
  empty; headers and cache policies were correct; no server-side endpoint exists, so 429 and
  Entra checks do not apply.
- CLI/package: the 11-file crate packed and installed into a clean root; the documented Git
  install fetched candidate `aeee6edd`; normal, missing, invalid, recovery, receipt, JSON,
  child-exit, and five-run reproducibility checks passed.
- Identity/performance: all 14 deployed files matched the candidate build. Live Lighthouse
  scored 100/100/100/100 with LCP 1.15 s, TBT 54.5 ms, and CLS 0. JS is 2,376 B gzip and CSS
  is 3,735 B gzip.

## How to reproduce

From an untouched checkout, execute each `.factory/claims.json` `test` field first. Then run:

```sh
npm ci
npm audit --audit-level=low
npm test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run test:release
npm run test:e2e
PLAYWRIGHT_BASE_URL=https://clean-env-runner.sociobot.in npm run test:e2e
cargo +1.85.0 test --locked
cargo package --locked --allow-dirty
```

## Next steps

Make the browser claim commands runnable in the required clean-clone phase. Complete the
claim inventory and make each tagged test prove its whole claim. Increase all visible link
hit areas to 44×44 px and add route-wide desktop/mobile target-size coverage. Then repeat an
independent verification.

Native Windows/macOS execution remains outside this Linux worker. The crate was packed and
installed but not published, as registry publication belongs to the factory.
