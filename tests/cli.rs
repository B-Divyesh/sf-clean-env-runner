#![cfg(unix)]

use serde_json::Value;
use std::fs;
use std::process::Command;

fn binary() -> &'static str {
    env!("CARGO_BIN_EXE_clean-env")
}

#[test]
fn run_exposes_only_declared_variables_and_scrubs_receipt() {
    let directory = tempfile::tempdir().unwrap();
    let manifest = directory.path().join("clean-env.toml");
    let receipt = directory.path().join("receipt.json");
    fs::write(
        &manifest,
        r#"version = 1
[env.PUBLIC]
value = "reviewable"
[env.TOKEN]
from_env = "SOURCE_TOKEN"
secret = true
"#,
    )
    .unwrap();

    let output = Command::new(binary())
        .env("SOURCE_TOKEN", "swordfish-never-print")
        .env("AMBIENT_SHOULD_DISAPPEAR", "leak")
        .args(["run", "--manifest"])
        .arg(&manifest)
        .args(["--receipt"])
        .arg(&receipt)
        .args(["--", "/usr/bin/env"])
        .output()
        .unwrap();

    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let stdout = String::from_utf8(output.stdout).unwrap();
    let mut lines: Vec<_> = stdout.lines().collect();
    lines.sort_unstable();
    assert_eq!(lines, ["PUBLIC=reviewable", "TOKEN=swordfish-never-print"]);

    let receipt_text = fs::read_to_string(receipt).unwrap();
    assert!(!receipt_text.contains("swordfish-never-print"));
    assert!(!receipt_text.contains("AMBIENT_SHOULD_DISAPPEAR"));
    let parsed: Value = serde_json::from_str(&receipt_text).unwrap();
    assert_eq!(parsed["environment"].as_array().unwrap().len(), 2);
    assert_eq!(parsed["environment"][1]["secret"], true);
}

#[test]
fn receipt_redacts_secret_values_embedded_in_the_working_directory() {
    let directory = tempfile::tempdir().unwrap();
    let secret = "cwd-secret-qa-47291";
    let secret_directory = directory.path().join("cases").join(secret);
    fs::create_dir_all(&secret_directory).unwrap();
    let manifest = directory.path().join("clean-env.toml");
    let receipt = secret_directory.join("receipt.json");
    fs::write(
        &manifest,
        r#"version = 1
[env.TOKEN]
from_env = "SOURCE_TOKEN"
secret = true
"#,
    )
    .unwrap();

    let output = Command::new(binary())
        .current_dir(&secret_directory)
        .env("SOURCE_TOKEN", secret)
        .args(["run", "--manifest"])
        .arg(&manifest)
        .args(["--receipt", "receipt.json", "--", "/usr/bin/true"])
        .output()
        .unwrap();

    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let receipt_text = fs::read_to_string(receipt).unwrap();
    assert!(
        !receipt_text.contains(secret),
        "declared secret leaked into receipt: {receipt_text}"
    );
    assert_eq!(
        serde_json::from_str::<Value>(&receipt_text).unwrap()["working_directory"],
        directory
            .path()
            .join("cases")
            .join("[REDACTED]")
            .display()
            .to_string()
    );
}

#[test]
fn receipt_path_success_and_error_messages_redact_declared_secrets() {
    let directory = tempfile::tempdir().unwrap();
    let secret = "receipt-path-secret-31415";
    let manifest = directory.path().join("clean-env.toml");
    fs::write(
        &manifest,
        r#"version = 1
[env.TOKEN]
from_env = "SOURCE_TOKEN"
secret = true
"#,
    )
    .unwrap();

    let successful_receipt = format!("receipt-{secret}.json");
    let successful = Command::new(binary())
        .current_dir(directory.path())
        .env("SOURCE_TOKEN", secret)
        .args(["run", "--manifest"])
        .arg(&manifest)
        .args(["--receipt", &successful_receipt, "--", "/usr/bin/true"])
        .output()
        .unwrap();
    assert!(successful.status.success());
    let successful_stderr = String::from_utf8(successful.stderr).unwrap();
    assert!(!successful_stderr.contains(secret));
    assert!(successful_stderr.contains("receipt-[REDACTED].json"));
    assert!(directory.path().join(successful_receipt).is_file());

    let blocked_parent = directory.path().join(format!("blocked-{secret}"));
    fs::write(&blocked_parent, "not a directory").unwrap();
    let failed = Command::new(binary())
        .current_dir(directory.path())
        .env("SOURCE_TOKEN", secret)
        .args(["run", "--manifest"])
        .arg(&manifest)
        .args(["--receipt"])
        .arg(blocked_parent.join("receipt.json"))
        .args(["--", "/usr/bin/true"])
        .output()
        .unwrap();
    assert_eq!(failed.status.code(), Some(70));
    let failed_stderr = String::from_utf8(failed.stderr).unwrap();
    assert!(!failed_stderr.contains(secret));
    assert!(failed_stderr.contains("blocked-[REDACTED]"));
}

#[test]
fn missing_required_input_uses_noinput_exit_code() {
    let directory = tempfile::tempdir().unwrap();
    let manifest = directory.path().join("clean-env.toml");
    fs::write(&manifest, "version=1\n[env.NEEDED]\ninherit=true\n").unwrap();
    let output = Command::new(binary())
        .env_remove("NEEDED")
        .args(["check", "--manifest"])
        .arg(manifest)
        .output()
        .unwrap();
    assert_eq!(output.status.code(), Some(66));
    assert!(String::from_utf8_lossy(&output.stderr).contains("NEEDED"));
}

#[test]
fn child_exit_code_is_preserved() {
    let directory = tempfile::tempdir().unwrap();
    let manifest = directory.path().join("clean-env.toml");
    fs::write(&manifest, "version=1\n").unwrap();
    let output = Command::new(binary())
        .current_dir(directory.path())
        .args(["run", "--no-receipt", "--manifest"])
        .arg(manifest)
        .args(["--", "/bin/sh", "-c", "exit 23"])
        .output()
        .unwrap();
    assert_eq!(output.status.code(), Some(23));
}

#[test]
fn bare_executable_is_resolved_from_the_declared_path() {
    let directory = tempfile::tempdir().unwrap();
    let manifest = directory.path().join("clean-env.toml");
    fs::write(
        &manifest,
        "version=1\n[env.PATH]\nvalue=\"/usr/bin:/bin\"\n[env.PROOF]\nvalue=\"clean\"\n",
    )
    .unwrap();
    let output = Command::new(binary())
        .current_dir(directory.path())
        .args(["run", "--no-receipt", "--manifest"])
        .arg(manifest)
        .args(["--", "env"])
        .output()
        .unwrap();
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("PROOF=clean"));
    assert!(!stdout.contains("HOME="));
}

#[test]
fn demo_runs_the_bundled_sample_in_an_isolated_directory() {
    let directory = tempfile::tempdir().unwrap();
    let demo = directory.path().join("sample-run");
    let output = Command::new(binary())
        .env("UNRELATED_PARENT_VALUE", "must-not-cross-boundary")
        .args(["demo", "--output"])
        .arg(&demo)
        .output()
        .unwrap();

    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("CI=true"));
    assert!(stdout.contains("PROJECT=sample-api"));
    assert!(stdout.contains("DEPLOY_TOKEN=sample-token-not-a-credential"));
    assert!(!stdout.contains("UNRELATED_PARENT_VALUE"));
    assert!(!stdout.contains("AMBIENT_DEMO_VARIABLE"));
    assert!(stdout.contains(&demo.display().to_string()));
    assert_eq!(
        fs::read_to_string(demo.join("clean-env.toml")).unwrap(),
        clean_env_runner::DEMO_MANIFEST
    );
    let receipt = fs::read_to_string(demo.join("receipt.json")).unwrap();
    assert!(!receipt.contains("sample-token-not-a-credential"));
}

#[test]
fn reporting_commands_emit_machine_readable_json() {
    let directory = tempfile::tempdir().unwrap();
    let manifest = directory.path().join("clean-env.toml");
    fs::write(&manifest, "version=1\n[env.CI]\nvalue=\"true\"\n").unwrap();

    for command in ["preview", "check"] {
        let output = Command::new(binary())
            .arg(command)
            .args(["--json", "--manifest"])
            .arg(&manifest)
            .output()
            .unwrap();
        assert!(output.status.success());
        serde_json::from_slice::<Value>(&output.stdout).unwrap();
    }

    let output = Command::new(binary())
        .args(["run", "--json", "--no-receipt", "--manifest"])
        .arg(&manifest)
        .args(["--", "/usr/bin/true"])
        .output()
        .unwrap();
    assert!(output.status.success());
    let run: Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(run["outcome"], "success");
    assert_eq!(run["receipt"], Value::Null);
}

#[test]
fn preview_and_check_redact_secrets_from_all_reported_metadata() {
    let directory = tempfile::tempdir().unwrap();
    let secret = "SOURCE_TOKEN";
    let secret_directory = directory.path().join(secret);
    fs::create_dir(&secret_directory).unwrap();
    let manifest = secret_directory.join("clean-env.toml");
    fs::write(
        &manifest,
        r#"version = 1
[env.TOKEN]
from_env = "SOURCE_TOKEN"
secret = true
"#,
    )
    .unwrap();

    for command in ["preview", "check"] {
        let output = Command::new(binary())
            .env("SOURCE_TOKEN", secret)
            .arg(command)
            .args(["--json", "--manifest"])
            .arg(&manifest)
            .output()
            .unwrap();
        assert!(output.status.success());
        let stdout = String::from_utf8(output.stdout).unwrap();
        assert!(!stdout.contains(secret), "{command} leaked: {stdout}");
        assert!(stdout.contains("[REDACTED]"));
        serde_json::from_str::<Value>(&stdout).unwrap();
    }
}
