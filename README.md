# Clean Env Runner

`clean-env` runs a local command inside an explicit environment boundary. It clears
the ambient process environment, adds only variables declared in `clean-env.toml`,
previews what changed, and writes a receipt without exposing secret values.

It is for developers reproducing scripts, build steps, and local CI runs without
silently carrying credentials or machine-specific settings from their shell.

## Install

Build the single binary with Rust 1.85 or newer:

```sh
cargo install --path .
```

The factory publishes release binaries separately.

## Usage

Run the bundled sample without creating a project:

```sh
clean-env demo
```

The command creates a temporary directory, runs a real clean boundary, writes a
scrubbed receipt, and prints the location. Use `clean-env demo --output <directory>`
to choose an empty destination. The same sample manifest ships in
[`examples/demo/clean-env.toml`](examples/demo/clean-env.toml).

Create a documented starter manifest:

```sh
clean-env init
```

Edit `clean-env.toml`:

```toml
version = 1

[env.PATH]
inherit = true
required = true

[env.NODE_ENV]
value = "test"

[env.DEPLOY_TOKEN]
from_env = "MY_DEPLOY_TOKEN"
secret = true
required = false
```

Then review and run:

```sh
clean-env preview
clean-env check
clean-env run -- npm test
```

`inherit = true` copies the same-named parent variable. `from_env = "NAME"`
copies a differently named parent variable, which is useful for keychain tools that
inject a secret just for this process. `value = "..."` declares a literal and may
not be combined with either source. Secret entries must use `inherit` or `from_env`;
literal secrets are rejected. Their values are always shown as `[REDACTED]`.

By default, successful and failed runs write `.clean-env/receipts/<id>.json`. The
receipt contains the command, working directory, manifest SHA-256, platform, timing,
exit status, and variable names/sources—never secret values. Use `--no-receipt` to
disable it or `--receipt <path>` to select a file.

Preview, check, and run support `--json` for scripts:

```sh
clean-env preview --json
clean-env check --json
clean-env run --json -- printenv
```

`--json` controls Clean Env Runner's own output. Child stdout/stderr remain attached
to the terminal. Exit codes are `0` for success, the child's status for a completed
run, `64` for invalid CLI use, `65` for an invalid manifest, `66` for missing input,
and `70` for an execution or receipt error.

## Platform notes

- Linux and macOS variable names are case-sensitive; Windows names are normalized
  case-insensitively and duplicate spellings are rejected.
- No ambient variables are added implicitly, including `HOME`, `PATH`, `TMP`, or
  `SystemRoot`. Declare what the child needs.
- Commands without a path are resolved using the declared child `PATH`. Use an
  absolute executable path when intentionally omitting `PATH`.
- Clean Env Runner does not store or fetch secrets. Use your OS keychain command to
  inject a named variable into the `clean-env` process, then reference it with
  `from_env`; only the name and presence cross into previews and receipts.

## Development

```sh
npm ci
npm test                 # Rust tests + site unit/accessibility smoke tests
npm run build            # release binary + site -> dist/
npm run build:site       # static site only -> dist/site/
cargo test
cargo package --locked --allow-dirty
```

Run the docs locally with `npm run dev`. The site stores no user data and has
no analytics, cookies, third-party scripts, or remote fonts. Read the published
[privacy policy](https://clean-env-runner.sociobot.in/privacy/) and
[terms](https://clean-env-runner.sociobot.in/terms/) for the local receipt and site-cache
details. Deployment publishes `dist/site` at <https://clean-env-runner.sociobot.in>.
The browser demo is available at
<https://clean-env-runner.sociobot.in/?demo=1#proofreader>.

The deployment artifact includes both portable `_headers` and Azure Static Web Apps
`staticwebapp.config.json` policy files. Hashed assets are cached for a year with
`immutable`; HTML and `sw.js` revalidate for prompt updates; the site sends a
same-origin CSP and restrictive Permissions-Policy.

## Project status

This is `0.1.1`. See [CHANGELOG.md](CHANGELOG.md) for release notes. Licensed under
the [MIT License](LICENSE).
