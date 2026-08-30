# Landing-page copy audit

Audited 2026-08-30 from `site/index.html`, `site/src/main.js`, and
`site/src/manifest.mjs`. Word counts treat hyphenated terms, version numbers, and command
names as one word. UI labels and terminal output are listed separately because they are not
sentences.

## Sentences

| Words | Sentence | Result |
| ---: | --- | --- |
| 12 | Offline-ready — the guide and sample manifest remain available after the first visit. | Pass |
| 9 | Offline edition — the guide and sample manifest remain available. | Pass |
| 5 | Run commands without ambient credentials. | Pass |
| 12 | For developers who need local commands to use a small, reviewable environment. | Pass |
| 5 | Free under the MIT License. | Pass |
| 5 | No accounts, analytics, or telemetry. | Pass |
| 5 | Receipts stay on your machine. | Pass |
| 4 | Loads a safe manifest. | Pass |
| 3 | Nothing is saved. | Pass |
| 12 | The demo creates a temporary manifest and receipt, then prints their location. | Pass |
| 10 | The manifest is the boundary; the receipt is the proof. | Pass |
| 5 | Start from an empty environment. | Pass |
| 16 | Most local runs inherit dozens of invisible choices: cloud keys, proxy settings, feature flags, language paths. | Pass |
| 10 | Clean Env Runner clears the slate before the command starts. | Pass |
| 4 | Allow only named variables. | Pass |
| 6 | See added, changed, and missing inputs. | Pass |
| 5 | Execute inside the scrubbed process. | Pass |
| 6 | Keep a receipt with values removed. | Pass |
| 6 | Demo — sample manifest, nothing is saved. | Pass |
| 5 | Audit a manifest before running. | Pass |
| 6 | This browser proofreader checks structure locally. | Pass |
| 6 | The CLI remains the authoritative validator. | Pass |
| 8 | Edit the text. The audit ledger updates immediately. | Pass; two four-word sentences |
| 3 | Use five commands. | Pass |
| 9 | Five commands cover setup, review, sample use, and execution. | Pass |
| 7 | Preview, check, and run can emit JSON. | Pass |
| 9 | Run a bundled sample in a new temporary directory. | Pass |
| 10 | Write a commented starter manifest without overwriting an existing one. | Pass |
| 11 | Show declared values, redactions, missing inputs, and the ambient removal count. | Pass |
| 11 | Validate the manifest and fail when a required source is unavailable. | Pass |
| 15 | Clear the environment, run the child, preserve its exit code, and write a scrubbed receipt. | Pass |
| 6 | See where each value comes from. | Pass |
| 5 | Copy the same-named parent variable. | Pass |
| 8 | Map an injected variable to a child name. | Pass |
| 5 | Declare a reviewable, non-secret literal. | Pass |
| 8 | Redact its value everywhere Clean Env Runner reports. | Pass |
| 4 | Literal secrets are refused. | Pass |
| 13 | Ask your OS keychain tool to inject a variable, then reference its name. | Pass |
| 5 | Clean Env Runner stores no credentials. | Pass |
| 9 | Run commands with only the environment variables you allow. | Pass |
| 4 | Built by Param Factory. | Pass |
| 7 | Fix the marked contract before running it. | Pass |
| 1 | Valid. | Pass |
| 6 | The child receives zero environment variables. | Pass |
| 8 | Everything not listed is removed before the child starts. | Pass |
| 4 | Command copied to clipboard. | Pass |
| 4 | Clipboard access was blocked. | Pass |
| 7 | Select the command and copy it manually. | Pass |
| 5 | Manifest must declare version = 1. | Pass |
| 4 | Literal secrets are refused. | Pass |

All sentences are at or below 22 words. The banned-word scan found no instances of
“leverage”, “seamless”, “effortless”, “robust”, “powerful”, “intuitive”, “reimagine”,
“supercharge”, “unlock”, “delightful”, “journey”, “ecosystem”, or “AI-powered”.

## UI labels and command text

The non-sentence labels are: Clean Env Runner; Demo; Install; Reference; Privacy; Terms;
Try it with sample data; Copy; Sample command; How it works; Declare; Preview; Run; Prove;
Reset demo; Start for real; Sample manifest; Safe example; Empty boundary; Broken secret;
Command reference; Manifest fields; Source & README; Back to masthead. Command and manifest
specimens retain their literal CLI syntax.

## Terminology

| Concept | One term used |
| --- | --- |
| Declarative configuration file | manifest |
| Process launched by the CLI | child |
| Allowed-variable perimeter | environment boundary |
| Local JSON record | receipt |
| Browser sample tool | proofreader |
| Sensitive manifest entry | secret |
| Parent-process variable | ambient variable |
| Shipped try-out | demo |

## First-screen read-aloud check

“Run commands without ambient credentials. For developers who need local commands to use a
small, reviewable environment. Try it with sample data.” This states the job, audience, and
first action in one breath.
