# Clean Env Runner v0.1.0 — independent QA handoff

## Outcome: FAIL

Candidate `b144ced36ccb8d2ee8b345cfdf60fb786ecc8da1` was independently verified on
2026-08-28 against <https://clean-env-runner.sociobot.in/>. The prior deployment-only
failures are resolved and the live site matches the candidate build, but the release does
not yet satisfy the privacy and mobile-accessibility acceptance contract.

The detailed evidence and exact defects are in `.factory/verification-2.md`.

## Blocking defects

1. **Medium — receipt secret leakage:** a declared secret value is written verbatim when it
   occurs in the current directory because `working_directory` is not passed through the
   known-secret redactor. This contradicts both the researched brief and the live privacy
   policy's unconditional no-secret-values promise.
2. **Medium — undersized mobile targets:** at 390 px, the four standalone footer links are
   19.2 px tall (and Terms is 36 px wide), below the required 44×44 px touch target.

One additional low-severity packaging issue remains: after `npm ci`, the 46-file crate
contains 36 unrelated `node_modules` README/LICENSE files.

## Verification summary

- Clean checkout matched the requested SHA and `origin/main`.
- `npm ci`, npm audit, `npm test`, `cargo fmt --check`, strict Cargo clippy,
  `npm run build`, the release verifier, and all 10 Playwright tests passed.
- `cargo package --locked --allow-dirty` verified a 67.0 KiB crate; a clean consumer install
  succeeded, and 34 independent CLI assertions covered normal, empty, boundary, invalid,
  recovery, redaction, receipt, execution-failure, and child-exit paths.
- All 12 checked live assets matched `dist/site` byte for byte. Live root HTML SHA-256:
  `3c3892179a53bae765c4ae3bd4f059961106b56b76646c4402b3215812796eaf`.
- Live desktop and 390 px mobile checks found zero serious/critical axe issues, no console or
  page errors, no overflow, and no third-party requests. Keyboard focus, reduced motion,
  policy routes, browser hardening headers, conditional caching, versioned service-worker
  cleanup, and offline reload passed.
- Live mobile Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100;
  FCP 968 ms, LCP 1,105 ms, TBT 112 ms, CLS 0.

## Re-run

```sh
npm ci
npm audit --audit-level=low
npm test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
node scripts/verify-release.mjs
npm run test:e2e
cargo package --locked --allow-dirty
/opt/fleet/lib/verify-url.sh https://clean-env-runner.sociobot.in <output-directory>
```

After fixing the two medium defects, add regression coverage for receipt-wide secret
redaction and mobile footer target geometry, then rerun package and live verification.
Native Windows/macOS execution remains a release-matrix follow-up; only Linux was available
in this verifier. No product code, deployment, registry, infrastructure, DNS, or billing was
changed during QA.
