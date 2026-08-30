# Clean Env Runner — repair handoff

## Outcome

Release candidate `e7cd775a252fdda410da8d08e6c213322d0ccecc`, reported in
`1b5985a714c38085a873610bb220b1acfede8cf3`, has been repaired. All high, medium,
and low verifier findings have exact regressions and pass locally. The release is now
`0.1.1`; artifact class remains a Rust CLI with a static Vite documentation site.

## Verifier findings repaired

1. **Receipt secret leak:** receipt serialization now scrubs every string field with all
   declared secret values. Working directories, command arguments, IDs, metadata, and
   variable source/name/state strings use the same final privacy boundary. Success and error
   receipt-path diagnostics are also scrubbed. Preview and check metadata use the same policy.
2. **Mobile footer targets:** every footer link is an inline flex target with a minimum
   44×44 CSS px box. The regression measures every footer link on `/`, `/privacy/`,
   `/terms/`, and `/404.html` in both Playwright projects, including 390×844.
3. **Crate contents:** Cargo include patterns are root-anchored. After `npm ci`, the crate has
   11 files and no `node_modules` README/LICENSE files (15.4 KiB compressed, 54.3 KiB
   unpacked).

The exact verifier value `cwd-secret-qa-47291` was first reproduced in
`working_directory`, then locked into `receipt_redacts_secret_values_embedded_in_the_working_directory`.
A fresh installed-crate rerun now records `/cases/[REDACTED]` and `rg` finds no secret.

## Product completion work

- Added `clean-env demo` and shipped `examples/demo/clean-env.toml`. It runs the real binary
  in a new temporary directory, proves an undeclared ambient variable stays out, writes a
  scrubbed receipt, and prints its location.
- Added the one-click browser demo at `/?demo=1#proofreader`, reset/leave controls, static
  no-JavaScript sample content, and `.factory/demo.md`.
- Added `.factory/claims.json` with 11 independently runnable tagged claims and exact
  sandboxes. Added `.factory/copy-audit.md`; all landing sentences are at most 22 words and
  the banned-word scan is clear.
- Replaced metaphor-first landing copy with a direct job headline and first action while
  preserving the monochrome environment-broadsheet design.
- Added route metadata, canonical/Open Graph/Twitter data, 1200×630 social art, a 180 px
  touch icon, a designed 404 route, response override, and Param Factory/version handoff.
- Hardened service-worker installation to fetch shell files with `cache: reload`, store full
  responses, and version from HTML plus the hashed asset list. Offline tests use their own
  browser contexts and verify controller, cache, offline state, reload, h1, and sample data.

## Verification evidence

Run from `/work/repo` on 2026-08-30 UTC:

```sh
npm ci
npm audit --audit-level=low
npm test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run test:release
npm run test:e2e
cargo package --locked --allow-dirty
```

- Clean install: 21 packages; npm audit reports 0 vulnerabilities.
- `npm test`: 6 Rust unit, 9 CLI integration, and 16 site/claim/release tests pass.
- Formatting and strict Clippy pass with no warnings. There is no separate TypeScript or
  JavaScript lint command; the site is plain JavaScript and its production bundle passes Vite.
- Production build: `dist/bin/clean-env` and `dist/site/` produced. Release verification
  passes. Initial JavaScript is 4,987 B; CSS is 14,467 B; desktop/mobile WebPs are 76,962 B
  and 25,452 B. All are below the product budgets.
- Playwright 1.58.2: 14/14 pass across desktop Chromium and 390×844 mobile. Coverage includes
  keyboard-only state recovery, no overflow, 44 px footer targets, zero serious/critical axe
  findings on root/policy/404 routes, no console errors, no user storage, same-origin-only
  demo requests, reduced/offline-ready behavior, and isolated offline reload.
- Every command in `.factory/claims.json` passes from the clean install.
- `cargo package --locked --allow-dirty`: 11 files; package verification passes. A fresh
  unpacked-crate `cargo install --path ... --root ... --locked` returns `clean-env 0.1.1`,
  exposes all five commands, runs the demo, and passes the secret-directory receipt case.
- Local mobile Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.0 s, LCP 1.2 s, TBT 50 ms, CLS 0, Speed Index 1.0 s.
- Release hashes: CLI
  `9c8ece53a2ca926e30512ffaf95fedc4677ff33f169cc50962459c755706a672`;
  site root `106f3273abcbdfd90b026ddec0d3a90fa33a17367f5d33de9032ee2c658ffe6f`;
  service worker `d1465e9688fea3720ad997a9a1c403e462f2fa1fab00555c46c62a209e951e10`;
  worker cache `clean-env-runner-921216957772`.

## Deployment and live identity

The static artifact to deploy is `dist/site` with:

```sh
/opt/fleet/lib/deploy-static.sh clean-env-runner /work/repo/dist/site
```

Live deployment evidence will be appended after the committed repair is pushed and the
factory deployment command completes.

## Known gaps

- CLI execution and consumer installation were run natively on Linux. Windows and macOS
  command selection is implemented behind target-specific Rust configuration but was not run
  on native hosts in this container.
- The crate is ready to publish but was not sent to a registry; publishing credentials belong
  to the factory.
