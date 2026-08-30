# Demo sandbox

## CLI demo

Run `clean-env demo`. The command copies `examples/demo/clean-env.toml` into a new
directory under the operating system's temporary directory. It runs the real environment
boundary against the platform environment-printing command, writes `receipt.json`, and
prints the directory to inspect. Use `clean-env demo --output <empty-directory>` to select
the location. Demo files never share a namespace with a real project.

The sample declares `CI`, `PROJECT`, and a placeholder `DEPLOY_TOKEN`. It also injects an
undeclared ambient marker during the run. The integration test confirms that the marker is
absent and the placeholder secret is absent from the receipt.

## Browser demo

Open <https://clean-env-runner.sociobot.in/?demo=1#proofreader> or select **Try it with
sample data** on the first screen. The proofreader loads the bundled safe manifest and shows
the audit result. **Reset demo** restores that sample. **Start for real** returns to the
install command.

The browser demo uses no user-data storage namespace because it writes no manifest data.
Edited text exists only in the current page's memory and disappears on reload. It never reads
or writes real CLI manifests or receipts. The service worker separately caches the public site
shell for offline reading, as described in the privacy policy.
