# Independent verification report — FAIL

**Work order:** `clean-env-runner-verify-2`

**Candidate:** `b144ced36ccb8d2ee8b345cfdf60fb786ecc8da1` (`main`)

**Verified URL:** <https://clean-env-runner.sociobot.in/>

**Date:** 2026-08-28 UTC

## Verdict

**FAIL.** The prior deployment-only failures are fixed: the live policy pages are real,
hashed assets are immutable, HTML and the service worker revalidate, and restrictive
browser policies are present. The live release also matches the candidate build byte for
byte. However, a packaged CLI run can still write a declared secret value into its receipt
through the unredacted working-directory field, contradicting the product's central privacy
guarantee. Standalone footer links also miss the required mobile touch-target size.

## Defects

### Medium — a declared secret can leak through `working_directory` in the receipt

`run` redacts known secret values from `command`, but copies the current directory into
`working_directory` without applying the same redaction. In a clean consumer, I used
`SOURCE_TOKEN=cwd-secret-5c79`, declared `TOKEN` as a secret sourced from that variable,
and ran the command from a directory named `cwd-secret-5c79`. The generated receipt
contained:

```json
"working_directory": "/tmp/cer-consumer.OMDWEb/cases/cwd-secret-5c79"
```

`rg 'cwd-secret-5c79' receipt.json` matched. The command itself and the environment section
were scrubbed correctly. This violates the brief's “Never log secret values” constraint and
the published privacy statement that “Receipts never contain declared secret values.” Apply
known-secret redaction to every receipt string field, including the working directory, and
add a regression test.

### Medium — mobile footer actions are below the required 44×44 px target

At the required 390×844 viewport, all primary navigation and button controls met the target,
but the four standalone footer links did not. Their measured boxes were Privacy 50.4×19.2,
Terms 36×19.2, Source & README 108×19.2, and Back to masthead 129.6×19.2 CSS px. The same
footer treatment is used on the policy pages. This misses the attached accessibility and
design requirement that touch/click targets be at least 44×44 CSS px. Add block padding or a
44 px minimum block size without creating overlapping targets.

### Low — the publishable crate contains unrelated `node_modules` documentation

After the documented `npm ci` workflow, `cargo package --locked --allow-dirty --list`
reported 46 files, 36 of which were dependency `node_modules/**/README.md` or `LICENSE`
files. The crate still verifies, installs, and is only 67.0 KiB compressed, so this does not
break consumers, but it is not a clean registry artifact. Anchor the Cargo `include` patterns
to repository-root files or explicitly exclude `node_modules`.

## Passing evidence

### Clean checkout, quality gates, and exact build

- Began from a clean `main` checkout at the requested SHA, matching `origin/main`.
- Toolchain: Rust 1.98.0, Cargo 1.98.0, Node 22.23.2, npm 10.9.8.
- `npm ci` installed 21 packages; `npm audit --audit-level=low` reported 0 vulnerabilities.
- `npm test` passed 4 Rust unit, 4 Rust CLI integration, and 7 site/release tests.
- `cargo fmt --check` passed.
- `cargo clippy --all-targets --all-features -- -D warnings` passed.
- Exact production command `npm run build` passed and produced `dist/bin/clean-env` and
  `dist/site/`. `node scripts/verify-release.mjs` passed.
- `npm run test:e2e` passed 10/10 tests across desktop Chromium and 390×844 mobile.
- Staged and release binaries matched at SHA-256
  `e66c02024dbb839df0a58a101778a00d13c620c190f5e9e99e008b9803490b59`.

### Packed CLI and end-to-end behavior

- `cargo package --locked --allow-dirty` verified the crate (233.5 KiB unpacked, 67.0 KiB
  compressed). Installing the unpacked crate into a fresh temporary root with
  `cargo install --path ... --root ... --locked` succeeded; `clean-env --version` returned
  `clean-env 0.1.0` and help documented all four commands.
- 34 independent consumer assertions passed. A manifest containing literal, empty, Unicode,
  remapped-secret, optional-missing, and explicit `PATH` values exposed only its declared
  variables; injected `AMBIENT_LEAK`, `SOURCE_TOKEN`, and `HOME` did not reach the child.
- Preview showed `[REDACTED]`; ordinary receipts contained no tested secret or ambient value,
  recorded only variable provenance, and redacted a secret embedded in a command argument.
- An empty manifest produced a zero-byte `/usr/bin/env` result and `--no-receipt` created no
  receipt directory.
- Missing required input returned 66 with machine-readable preview data and succeeded after
  the input was supplied. Unsupported version, ambiguous source, unknown field, malformed
  TOML, and literal-secret manifests returned 65; the literal was not echoed. A missing file
  returned 66, invalid CLI use returned 64, execution failure returned 70 with the secret in
  its path redacted, and child exit 23 was preserved in both status and receipt.

### Live identity, policies, privacy, and caching

- `/opt/fleet/lib/verify-url.sh` returned HTTP 200 in 864 ms with no console/page errors,
  title `Clean Env Runner — No ambient credentials`, `lang=en`, one h1, a main landmark,
  complete image alt text, and labeled buttons.
- All 12 fetched public artifacts matched the candidate build byte for byte: root and explicit
  index HTML, privacy, terms, JS, CSS, both WebPs, favicon, service worker, robots, and sitemap.
  Live/root candidate SHA-256 is
  `3c3892179a53bae765c4ae3bd4f059961106b56b76646c4402b3215812796eaf`.
- `/privacy/` and `/terms/` return real 200 pages; an unknown route returns 404; HTTP redirects
  to HTTPS. TLS verification passed over HTTP/2.
- Root, policy pages, JS, CSS, image, and service-worker responses carry the restrictive
  same-origin CSP and Permissions-Policy plus HSTS, `Referrer-Policy: same-origin`, and
  `X-Content-Type-Options: nosniff`.
- Hashed JS/CSS and both images return `public, max-age=31536000, immutable`; root, policy
  pages, and `sw.js` return `no-cache, must-revalidate`. Conditional requests returned 304.
- Desktop 1440×900 and mobile 390×844 had no page overflow, console errors, page errors, or
  failed requests. The root and both policy pages had zero serious/critical axe findings.
- Keyboard traversal reached every interactive element without a trap. The skip link was the
  first tab stop, became visible, and used a 3 px proof-red outline. Presets handled empty and
  invalid input and recovered to a valid state through keyboard input.
- Runtime requests stayed entirely on `https://clean-env-runner.sociobot.in`; manifest input
  appeared in no request body. Cookies, localStorage, sessionStorage, and IndexedDB remained
  empty, and edited manifest text did not persist after reload.
- Reduced-motion emulation matched and changed smooth scrolling to `auto`; transition and
  animation duration were effectively zero (`0.01ms`).
- The service worker used cache `clean-env-runner-04dc74f99008`, `registration.update()`
  completed, a fresh activation removed an injected stale cache, and offline reload retained
  the expected h1 and displayed the offline status.

### Performance budgets

- Initial JS 4,471 B, CSS 12,474 B, desktop WebP 76,962 B, mobile WebP 25,452 B, and no font
  payload: all are comfortably within the stated budgets.
- Mobile Lighthouse against the live URL scored Performance **99**, Accessibility **100**,
  Best Practices **100**, and SEO **100**. FCP was 968 ms, LCP 1,105 ms, TBT 112 ms, CLS 0,
  and Speed Index 968 ms. Lighthouse emitted no run warnings; lab data does not provide INP.

## Coverage boundary

The packaged release was built and exercised natively on Linux. Only the Linux Rust target
was installed in the verifier, so Windows and macOS behavior was reviewed in source but not
executed on native hosts. No registry publication or deployment mutation was performed.
