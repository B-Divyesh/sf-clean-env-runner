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
