# Clean Env Runner — repair handoff

## Outcome

**PASS.** Work order `clean-env-runner-repair-5` repaired both release blockers reported in
verifier commit `b393ec35bf102db64d8a7f297b2bf89680dad7ca` for candidate
`37dc3dd1ae375c8fcba9ddd188e98b00b0f5750c`. The repair is commit
`0aa837eb2226bef388657ba067d3269cbd09b3b4`, pushed to `origin/main` and deployed at
<https://clean-env-runner.sociobot.in/>. The product remains a Rust single-binary CLI with a
static Vite documentation/demo site.

## Release blockers repaired

1. **Browser claims failed without `dist/`.** Both exact Playwright claim commands were
   reproduced from the installed checkout with no `dist/`; each timed out after 60 seconds.
   Playwright now starts `preview:test`, which runs `build:site` before Vite preview. Each
   unchanged command then passed independently from an absent `dist/` in desktop Chromium and
   the 390×844 mobile project. A Node contract test locks the claims, package script, and
   Playwright server wiring together.
2. **The landing page falsely said “No browser storage.”** The first-screen fact now says
   “No user data stored or analytics.” The privacy policy continues to disclose the separate
   offline shell cache. The browser regression proves Cache Storage exists for public shell
   files while edited manifest text appears in no cache URL, request, cookie, localStorage,
   sessionStorage, or IndexedDB entry. A static contract test rejects the old absolute copy.

The copy audit and demo documentation now use the same precise user-data/cache distinction.
The visible build identity was advanced to `repair-5`; product version `0.1.1`, the researched
brief, visual system, CLI behavior, artifact class, and deployment class are unchanged.

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
PLAYWRIGHT_BASE_URL=https://clean-env-runner.sociobot.in npm run test:e2e
```

- Clean install added 21 packages; npm reported zero vulnerabilities.
- `npm test` passed 6 Rust unit tests, 9 CLI integration tests, and 18 Node
  claim/site/release-contract tests. Formatting and strict Clippy passed. The plain JavaScript
  site has no separate type or lint task; Vite compiled its production modules successfully.
- Every command in `.factory/claims.json` passed exactly. The two Playwright claim commands
  each passed 2/2 from an absent `dist/`. All nine Node claim commands and the response-policy
  claim passed independently.
- `npm run test:release` produced `dist/bin/clean-env` and `dist/site`, then passed artifact
  policy verification. The staged and release binaries have the same SHA-256:
  `9c8ece53a2ca926e30512ffaf95fedc4677ff33f169cc50962459c755706a672`.
- `cargo package --locked --allow-dirty` verified 11 intended files: 57.3 KiB unpacked and
  15.8 KiB compressed. The unpacked crate installed into a fresh consumer root. Its single
  executable reported `clean-env 0.1.1`, exposed all five documented commands, ran the bundled
  demo, redacted the preview, admitted exactly the three declared sample variables, excluded
  an injected ambient variable, and honored `--no-receipt`.
- Five isolated clean-environment consumer runs produced identical output: 5/5. This exceeds
  the brief's 80% reproducibility measure.
- Local Playwright passed 18/18 across desktop Chromium and 390×844. Coverage includes no
  overflow, 44px footer targets, keyboard-only error recovery, visible focus, reduced motion,
  zero serious/critical axe findings on root/privacy/terms/404, no console errors, the
  privacy/storage boundary, service-worker update, and isolated offline reload.
- `/opt/fleet/lib/verify-url.sh` passed locally in 527 ms and live in 858 ms with the expected
  title, `lang=en`, one h1, main landmark, complete image alt text, labeled buttons, and no
  console/page errors.
- Local mobile Lighthouse 12.8.2 scored Performance 100, Accessibility 100, Best Practices
  100, and SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 0 ms, CLS 0, Speed Index 1.0 s, no warnings.
- The release payload is 4,987 B JavaScript, 14,467 B CSS, 76,962 B desktop WebP, 25,452 B
  mobile WebP, and no font download. These remain below all product budgets.

## Deployment and live identity

The pushed repair was deployed with the work order's static configuration:

```sh
/opt/fleet/lib/deploy-static.sh clean-env-runner /work/repo/dist/site
```

- Azure Static Web Apps deployment `0a252f76-3980-4145-bc90-a973220d61e2` succeeded in
  `eastus2`; the custom domain reported `Ready` and HTTPS returned 200.
- All 14 public files match `dist/site` byte-for-byte. Root SHA-256 is
  `a240906eaaf179c9fe19d0dcf090c81c82851cb054836f1aade982f18dbc9b74`; service-worker
  SHA-256 is `bcbc16c98b3d85fd4c3f4a4fd866d96639dba8435893532e8ba43c52a902a49e`; its cache is
  `clean-env-runner-cb3e45f94c77`.
- Root, privacy, terms, and 404 metadata pass; every discovered internal and GitHub link
  returns 200. An unknown route returns the designed 404 and HTTP redirects to HTTPS.
- Root and `sw.js` send `no-cache, must-revalidate`; hashed assets and WebPs send
  `public, max-age=31536000, immutable`. Conditional requests return 304.
- HTML, JavaScript, the service worker, and images send the same-origin CSP, restrictive
  Permissions-Policy, HSTS, `Referrer-Policy: same-origin`, and `nosniff`.
- The full live Playwright matrix passed 18/18 on desktop and 390px mobile, including axe,
  keyboard, privacy, update, and offline checks.
- Live mobile Lighthouse scored 100 in all four categories; FCP 0.8 s, LCP 1.1 s, TBT 20 ms,
  CLS 0, Speed Index 0.8 s, no warnings.

## Known gaps and next steps

- The CLI and consumer package were executed natively on Linux. Windows and macOS branches
  remain covered by source review but were not run on native hosts in this container.
- Lighthouse lab data does not provide INP; TBT was used as the interaction proxy.
- The crate is ready to publish but was not uploaded to a registry because registry
  credentials and publication belong to the factory.
- No release-blocking product-QA finding remains. No backend, payment, account, or AI flow is
  part of this brief, so response-allowance, billing, identity-provider, and live-AI checks do
  not apply.
