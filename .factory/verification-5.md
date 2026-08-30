# Independent verification report — FAIL

**Work order:** `clean-env-runner-verify-5`
**Candidate:** `66de87421121c7fbe234f6b6e0e53bc8b0677a35` (`main`)
**Verified URL:** <https://clean-env-runner.sociobot.in/>
**Date:** 2026-08-30 UTC

## Verdict

**FAIL.** The CLI performs the researched environment-boundary job, every registered claim
passes after the clean dependency install, the first-read/demo gate passes, and the live site
is byte-identical to the candidate build. Release acceptance still fails because the landing
page and README contain testable promises absent from `.factory/claims.json`. The live Install
**Copy** action also reports failure after a successful clipboard write. These are fresh
contract and user-facing findings, not a deployment-only failure.

## Release-blocking defects

### High — testable landing and README promises are missing from `claims.json`

The supplied claims contract says every statement a visitor can rely on must have exactly one
`.factory/claims.json` entry and one `@claim:<id>` test; an unlisted claim fails review. The
candidate lists 11 claims, but its public copy makes additional concrete, testable promises.
Examples include:

- Landing command reference: `clean-env init` will “Write a commented starter manifest
  without overwriting an existing one.”
- README receipt controls: `--no-receipt` disables the receipt and `--receipt <path>` selects
  a destination.
- README command resolution: a bare executable is resolved using the declared child `PATH`.

No claim ID names or tests these promises. Some behavior has ordinary Rust coverage and was
also confirmed manually during this verification, but ordinary untagged coverage does not
satisfy the explicit claim inventory contract. Add claim entries and one observable demo-based
tagged test per promise, or remove/narrow the public promises.

### Medium — successful Copy action announces a false clipboard failure

On the live root page in a fresh Chromium context with clipboard permission, direct
`navigator.clipboard.writeText` resolved successfully. Instrumenting the original method and
activating **Copy** recorded a successful write of the full install command. The UI nevertheless
left the button as `Copy` and changed its live status to:

```text
Clipboard access was blocked. Select the command and copy it manually.
```

The candidate source awaits `navigator.clipboard.writeText(...)` and then accesses
`event.currentTarget`. For an async event listener, `currentTarget` is null after dispatch;
setting its text throws and the broad catch incorrectly treats that exception as a clipboard
denial. Capture the button in a local variable before awaiting, and add a keyboard/browser
regression for both successful copy and denied-permission recovery.

### Low — the real 404 route omits required social metadata

`/404.html` has a specific title, description, canonical, one H1, and `noindex`, but it has no
Open Graph or Twitter card metadata. Root, privacy, and terms include the product social card.
The attached site-structure contract requires Open Graph and Twitter card metadata on routes;
apply the existing product-specific card to the 404 route as well.

## Mandatory first-read and demo result

**PASS.** A cold live load says:

- what it does: “Run commands without ambient credentials.”
- who it is for: “For developers who need local commands to use a small, reviewable
  environment.”
- what to click: “Try it with sample data,” with “Loads a safe manifest. Nothing is saved.”

One click opens `/?demo=1#proofreader`, sets the title to `Demo — Clean Env Runner`, displays a
realistic three-variable sample, and shows the persistent “Demo — sample manifest, nothing is
saved” banner with **Reset demo** and **Start for real**.

## Claims gate

The claims gate was the first QA action. Before dependencies were installed, all nine Node/Rust
commands passed; the two Playwright commands could not import `@playwright/test` from the
uninstalled clone, so no browser assertion ran. After the required clean `npm ci`, every exact
command from `.factory/claims.json` passed:

- `explicit-boundary`, `receipt-secret-redaction`, `literal-secret-refusal`, `demo-command`,
  `json-output`, `stable-exits`, `mit-license`, `single-binary`, and `response-policy`: 1/1 each.
- `browser-local-only` and `offline-reload`: 2/2 each across desktop Chromium and the 390 px
  mobile project.

Final installed result: **11/11 claim entries passed**. The initial module-resolution errors
were an uninstalled-toolchain precondition, not failed product assertions. The unlisted claims
above remain a separate release blocker under the same contract.

## Passing evidence

### Clean install, tests, lint, and exact build

- Checkout was clean and exactly
  `66de87421121c7fbe234f6b6e0e53bc8b0677a35` before QA.
- `npm ci` installed 21 packages; `npm audit --audit-level=low` found zero vulnerabilities.
- `npm test` passed 6 Rust unit tests, 9 CLI integration tests, and 18 Node tests.
- `cargo fmt --check` and
  `cargo clippy --all-targets --all-features -- -D warnings` passed. The repository has no
  separate JavaScript typecheck or lint script.
- `npm run test:release` ran the exact production build and artifact verifier successfully,
  producing `dist/bin/clean-env` and `dist/site`.
- Local and live `npm run test:e2e` each passed 18/18 across desktop and 390×844 Chromium.

### Packed CLI and independent end-to-end exercise

- `cargo package --locked --allow-dirty` verified the intended 11-file crate: 57.3 KiB
  unpacked and 15.8 KiB compressed.
- Installing the unpacked crate into a fresh consumer root produced `clean-env 0.1.1` and one
  executable with demo, init, preview, check, and run.
- The packaged, release, and staged binaries shared SHA-256
  `9c8ece53a2ca926e30512ffaf95fedc4677ff33f169cc50962459c755706a672`.
- `clean-env demo --output <empty-directory>` ran the real child boundary, wrote its bundled
  manifest and scrubbed receipt, printed where to inspect them, and rejected reuse of the
  populated directory with exit 65 and recovery advice.
- A normal run admitted exactly `CI`, `DEPLOY_TOKEN`, and `PROJECT`; an injected ambient probe
  did not reach the child. Preview/check JSON parsed and showed the secret as `[REDACTED]`.
- Empty-boundary preview, check, and run succeeded with zero child-environment bytes. An absent
  optional source was omitted, and a Unicode literal (`π-雪`) survived unchanged.
- Missing required input returned 66 and recovered when supplied; a literal secret and version
  255 returned 65 without exposing the literal; missing CLI arguments returned 64; missing
  executable returned 70; and child exit 23 was preserved.
- A secret embedded in the working-directory path and command was `[REDACTED]` in the receipt
  and absent from CLI diagnostics. `--no-receipt` created no receipt.
- Five isolated `env -i` demo runs produced exactly the same three variables: 5/5 (100%),
  exceeding the brief's 80% reproducibility measure.

### Live identity, privacy, security, caching, and accessibility

- All 14 public candidate files matched live bytes and SHA-256 values, including root
  `a240906eaaf179c9fe19d0dcf090c81c82851cb054836f1aade982f18dbc9b74`
  and worker
  `bcbc16c98b3d85fd4c3f4a4fd866d96639dba8435893532e8ba43c52a902a49e`.
- The factory URL verifier returned 200 in 861 ms with the expected title, `lang=en`, one H1,
  main landmark, complete image alt text, labeled buttons, and no console/page errors.
- A fresh live demo request log contained only same-origin GETs for HTML, hashed JS/CSS, and
  the responsive product image. Cookies, localStorage, sessionStorage, and IndexedDB remained
  empty; only the disclosed versioned shell cache existed. Edited manifest text was not sent or
  persisted.
- Root, policies, worker, assets, and images sent same-origin CSP, restrictive
  Permissions-Policy, HSTS, `Referrer-Policy: same-origin`, and `nosniff`.
- HTML and `sw.js` sent `no-cache, must-revalidate`; hashed JS/CSS and WebPs sent
  `public, max-age=31536000, immutable`; an asset ETag request returned 304.
- Root, privacy, terms, and 404 passed the desktop/mobile axe serious/critical baseline. There
  were no console/page errors or 390 px overflow. All visible 390 px controls measured at least
  44 px in both dimensions. Fresh keyboard traversal exposed the skip link with a 3 px
  proof-red focus outline and no trap; invalid proofreader input recovered by keyboard.
- Reduced motion disabled smooth scrolling and transitions. Service-worker update and isolated
  offline reload passed; the guide, sample, and offline state remained usable.
- Every discovered internal and GitHub link returned 200. An unknown route returned the
  designed 404, and HTTP redirected to HTTPS.

### Performance and budgets

- Initial app JavaScript is 4,987 B raw (the worker adds 1,250 B), CSS is 14,467 B, the mobile
  hero is 25,452 B, and no fonts download. All supplied static-product budgets pass.
- Live mobile Lighthouse 12.8.2 scored Performance 100, Accessibility 100, Best Practices 100,
  and SEO 100. FCP was 1.06 s, LCP 1.07 s, TBT 14 ms, CLS 0, and Speed Index 1.20 s, with no
  run warnings. Lab Lighthouse did not provide INP.

## Applicability and remaining coverage boundaries

This product is a static site plus a local CLI. Its request log exposed no server-side product
or product-unlock endpoint, account, sign-in, payment, or AI flow, so API allowance/429, Entra,
billing, and AI checks do not apply. Native CLI execution was verified on Linux; Windows and
macOS platform branches were source-reviewed but not run on native hosts. The crate was packed
and installed but not published, as registry publication belongs to the factory.
