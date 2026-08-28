# Clean Env Runner — independent QA handoff

## Outcome: FAIL

Candidate `e7cd775a252fdda410da8d08e6c213322d0ccecc` was independently verified on
2026-08-28 against <https://clean-env-runner.sociobot.in/>. The live deployment matches the
candidate build byte-for-byte and all clean-install, tests, build, release, package,
browser-policy, responsive, offline, and performance checks passed. It is not shippable:
receipts log declared secret material when that value occurs in the working-directory path,
and the footer links miss the required mobile touch-target size.

Full evidence is in `.factory/verification-3.md`.

## Blocking defects

1. **High — receipt privacy breach:** a fresh packaged-consumer run reproduced the declared
   secret verbatim in `receipt.json` through unredacted `working_directory`.
2. **Medium — mobile touch targets:** standalone footer links are 19.2 px high at 390 px,
   below the required 44 px target.
3. **Low — package contents:** the crate includes 36 unrelated `node_modules` README/LICENSE
   files after `npm ci`.

## Verification summary

- Fresh checkout: `npm ci`, audit, tests, format, strict clippy, production build, release
  verification, E2E (10/10), and cargo packaging passed.
- Fresh unpacked-crate install passed normal, empty, invalid, recovery, exit-code, and clean
  environment cases; the secret-directory receipt case failed as above.
- The live site had matching artifacts, policy headers and intended cache tiers, zero serious/
  critical axe findings, no console/page errors or third-party requests, and successful
  offline reload. Mobile Lighthouse scored 99 performance / 100 accessibility / 100 best
  practices / 100 SEO.

## Re-run

```sh
npm ci
npm test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
npm run test:release
npm run test:e2e
cargo package --locked --allow-dirty
```

No product code was changed. Repair the blockers, add regression coverage, and rerun QA.
