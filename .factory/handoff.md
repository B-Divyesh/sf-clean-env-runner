# Clean Env Runner — independent verification handoff

## Outcome

**FAIL.** Candidate `37dc3dd1ae375c8fcba9ddd188e98b00b0f5750c` was independently
verified on 2026-08-30 UTC against <https://clean-env-runner.sociobot.in/>. The deployed site
is byte-identical to the candidate, the core CLI works end to end, and the first-read/demo
gate passes. Two claim-contract defects block release:

1. After clean `npm ci`, the exact `browser-local-only` and `offline-reload` commands in
   `.factory/claims.json` time out because Playwright starts `vite preview` without first
   creating `dist/`. Both pass only after a separate `npm run build`.
2. The first screen says “No browser storage or analytics,” but the offline service worker
   creates Cache Storage containing eight shell files. The listed claim only promises no
   stored user data, and the privacy page correctly discloses the shell cache.

Full evidence and remediation are in `.factory/verification-4.md`.

## Verification summary

- First read and one-click sample demo: pass.
- Claims: 9 exact Node commands pass; 2 exact browser commands fail from the clean installed
  checkout, then pass after production build in desktop and mobile projects.
- `npm audit --audit-level=low`, `npm test`, `cargo fmt --check`, strict Clippy,
  `npm run build`, `npm run test:release`: pass.
- Local Playwright: 18/18 pass. Production Playwright: 18/18 pass.
- `cargo package --locked`: 11 files; clean consumer install and broad CLI matrix pass.
- Clean-shell reproducibility: 5/5 identical runs; environment boundary and all-field secret
  redaction pass.
- Candidate/live identity: 13/13 deployable public files match byte-for-byte.
- Desktop/390 px, keyboard focus, reduced motion, offline update/reload, privacy request log,
  headers/cache, routes/links, and axe serious/critical: pass.
- Live Lighthouse: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP
  1.08 s, TBT 1 ms, CLS 0.

## Reproduce

```sh
npm ci
npx playwright test --grep='@claim:browser-local-only'  # fails: no dist/ for preview
npx playwright test --grep='@claim:offline-reload'      # fails: no dist/ for preview
npm test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run test:release
npm run test:e2e
PLAYWRIGHT_BASE_URL=https://clean-env-runner.sociobot.in npm run test:e2e
cargo package --locked
```

After `npm run build`, rerunning either exact browser claim command passes 2/2. Fix the claim
harness so that build prerequisite is part of the listed command (or serve a clean checkout),
and replace the false absolute browser-storage wording with the tested “no user data stored”
claim before re-verification.

## Coverage boundary

The CLI package was built, installed, and executed on Linux. Windows and macOS target-specific
behavior was not run on native hosts. No product code, deployment, registry, infrastructure,
DNS, or billing state was changed during verification.
