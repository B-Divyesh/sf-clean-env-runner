use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, HashSet};
use std::env;
use std::ffi::{OsStr, OsString};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

pub const DEFAULT_MANIFEST: &str = "clean-env.toml";
pub const DEMO_MANIFEST: &str = include_str!("../examples/demo/clean-env.toml");
pub const STARTER_MANIFEST: &str = r#"# Clean Env Runner manifest. Only these names reach the child process.
version = 1

[env.PATH]
inherit = true
required = true

[env.CI]
value = "true"

# Secrets are references, never literal values:
# [env.DEPLOY_TOKEN]
# from_env = "MY_DEPLOY_TOKEN"
# secret = true
# required = true
"#;

#[derive(Debug)]
pub struct AppError {
    pub code: i32,
    pub message: String,
}

impl AppError {
    pub fn new(code: i32, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for AppError {}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Manifest {
    pub version: u8,
    #[serde(default)]
    pub env: BTreeMap<String, Variable>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Variable {
    #[serde(default)]
    pub value: Option<String>,
    #[serde(default)]
    pub inherit: bool,
    #[serde(default)]
    pub from_env: Option<String>,
    #[serde(default)]
    pub secret: bool,
    #[serde(default = "required_by_default")]
    pub required: bool,
}

fn required_by_default() -> bool {
    true
}

#[derive(Debug, Clone, Serialize)]
pub struct Preview {
    pub manifest: String,
    pub manifest_sha256: String,
    pub declared: usize,
    pub removed: usize,
    pub missing_required: usize,
    pub variables: Vec<PreviewVariable>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PreviewVariable {
    pub name: String,
    pub source: String,
    pub state: String,
    pub display_value: Option<String>,
    pub secret: bool,
    pub required: bool,
}

#[derive(Debug, Clone)]
pub struct ResolvedEnvironment {
    pub values: Vec<(String, OsString)>,
    pub preview: Preview,
    pub secret_values: Vec<OsString>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Receipt {
    pub schema_version: u8,
    pub id: String,
    pub manifest_sha256: String,
    pub command: Vec<String>,
    pub working_directory: String,
    pub platform: String,
    pub started_unix_ms: u128,
    pub duration_ms: u128,
    pub exit_code: Option<i32>,
    pub outcome: String,
    pub environment: Vec<ReceiptVariable>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReceiptVariable {
    pub name: String,
    pub source: String,
    pub secret: bool,
    pub state: String,
}

pub fn load_manifest(path: &Path) -> Result<(Manifest, String, String), AppError> {
    let raw = fs::read_to_string(path).map_err(|error| {
        let code = if error.kind() == io::ErrorKind::NotFound {
            66
        } else {
            70
        };
        AppError::new(code, format!("could not read {}: {error}", path.display()))
    })?;
    let manifest: Manifest = toml::from_str(&raw)
        .map_err(|error| AppError::new(65, format!("invalid {}: {error}", path.display())))?;
    validate_manifest(&manifest)?;
    let digest = format!("{:x}", Sha256::digest(raw.as_bytes()));
    Ok((manifest, raw, digest))
}

pub fn validate_manifest(manifest: &Manifest) -> Result<(), AppError> {
    if manifest.version != 1 {
        return Err(AppError::new(
            65,
            format!(
                "unsupported manifest version {}; expected 1",
                manifest.version
            ),
        ));
    }
    let mut normalized = HashSet::new();
    for (name, variable) in &manifest.env {
        validate_name(name)?;
        let key = if cfg!(windows) {
            name.to_uppercase()
        } else {
            name.clone()
        };
        if !normalized.insert(key) {
            return Err(AppError::new(
                65,
                format!("duplicate environment name after platform normalization: {name}"),
            ));
        }
        if let Some(source) = &variable.from_env {
            validate_name(source)?;
        }
        let sources = usize::from(variable.value.is_some())
            + usize::from(variable.inherit)
            + usize::from(variable.from_env.is_some());
        if sources != 1 {
            return Err(AppError::new(
                65,
                format!("{name} must declare exactly one of value, inherit, or from_env"),
            ));
        }
        if variable.secret && variable.value.is_some() {
            return Err(AppError::new(
                65,
                format!(
                    "{name} is secret and must reference inherit or from_env; literal secrets are not allowed"
                ),
            ));
        }
    }
    Ok(())
}

fn validate_name(name: &str) -> Result<(), AppError> {
    if name.is_empty() || name.contains('=') || name.contains('\0') {
        Err(AppError::new(
            65,
            format!("invalid environment variable name {name:?}"),
        ))
    } else {
        Ok(())
    }
}

pub fn resolve_environment(
    manifest: &Manifest,
    path: &Path,
    digest: String,
) -> ResolvedEnvironment {
    let ambient_names: HashSet<String> = env::vars_os()
        .filter_map(|(name, _)| name.into_string().ok())
        .map(|name| {
            if cfg!(windows) {
                name.to_uppercase()
            } else {
                name
            }
        })
        .collect();
    let declared_names: HashSet<String> = manifest
        .env
        .keys()
        .map(|name| {
            if cfg!(windows) {
                name.to_uppercase()
            } else {
                name.clone()
            }
        })
        .collect();

    let mut values = Vec::new();
    let mut variables = Vec::new();
    let mut secret_values = Vec::new();
    let mut missing_required = 0;

    for (name, variable) in &manifest.env {
        let (source, value) = if let Some(value) = &variable.value {
            ("literal".to_owned(), Some(OsString::from(value)))
        } else if variable.inherit {
            (format!("env:{name}"), env::var_os(name))
        } else {
            let source_name = variable.from_env.as_deref().expect("validated source");
            (format!("env:{source_name}"), env::var_os(source_name))
        };

        let parent_same = env::var_os(name);
        let state = match &value {
            None => {
                if variable.required {
                    missing_required += 1;
                }
                "missing"
            }
            Some(value) if parent_same.as_ref() == Some(value) => "unchanged",
            Some(_) if parent_same.is_some() => "changed",
            Some(_) => "added",
        }
        .to_owned();

        let display_value = value.as_ref().map(|value| {
            if variable.secret {
                "[REDACTED]".to_owned()
            } else {
                value.to_string_lossy().into_owned()
            }
        });
        if let Some(value) = value {
            if variable.secret {
                secret_values.push(value.clone());
            }
            values.push((name.clone(), value));
        }
        variables.push(PreviewVariable {
            name: name.clone(),
            source,
            state,
            display_value,
            secret: variable.secret,
            required: variable.required,
        });
    }

    let removed = ambient_names.difference(&declared_names).count();
    ResolvedEnvironment {
        values,
        secret_values,
        preview: Preview {
            manifest: path.display().to_string(),
            manifest_sha256: digest,
            declared: manifest.env.len(),
            removed,
            missing_required,
            variables,
        },
    }
}

pub fn ensure_complete(environment: &ResolvedEnvironment) -> Result<(), AppError> {
    if environment.preview.missing_required == 0 {
        return Ok(());
    }
    let names = environment
        .preview
        .variables
        .iter()
        .filter(|item| item.required && item.state == "missing")
        .map(|item| item.name.as_str())
        .collect::<Vec<_>>()
        .join(", ");
    Err(AppError::new(
        66,
        format!("required environment input missing: {names}"),
    ))
}

pub fn unix_ms_now() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

pub fn receipt_id(started: u128) -> String {
    format!("{started}-{}", std::process::id())
}

pub fn default_receipt_path(id: &str) -> PathBuf {
    PathBuf::from(".clean-env")
        .join("receipts")
        .join(format!("{id}.json"))
}

pub fn redact_argument(argument: &OsStr, secret_values: &[OsString]) -> String {
    redact_text(&argument.to_string_lossy(), secret_values)
}

pub fn redact_text(text: &str, secret_values: &[OsString]) -> String {
    let mut text = text.to_owned();
    for secret in secret_values {
        let secret = secret.to_string_lossy();
        if !secret.is_empty() {
            text = text.replace(secret.as_ref(), "[REDACTED]");
        }
    }
    text
}

pub fn scrub_preview(preview: &Preview, secret_values: &[OsString]) -> Preview {
    let mut scrubbed = preview.clone();
    scrubbed.manifest = redact_text(&scrubbed.manifest, secret_values);
    scrubbed.manifest_sha256 = redact_text(&scrubbed.manifest_sha256, secret_values);
    for variable in &mut scrubbed.variables {
        variable.name = redact_text(&variable.name, secret_values);
        variable.source = redact_text(&variable.source, secret_values);
        variable.state = redact_text(&variable.state, secret_values);
        if let Some(value) = &mut variable.display_value {
            *value = redact_text(value, secret_values);
        }
    }
    scrubbed
}

fn scrub_receipt(receipt: &Receipt, secret_values: &[OsString]) -> Receipt {
    let mut scrubbed = receipt.clone();
    scrubbed.id = redact_text(&scrubbed.id, secret_values);
    scrubbed.manifest_sha256 = redact_text(&scrubbed.manifest_sha256, secret_values);
    for argument in &mut scrubbed.command {
        *argument = redact_text(argument, secret_values);
    }
    scrubbed.working_directory = redact_text(&scrubbed.working_directory, secret_values);
    scrubbed.platform = redact_text(&scrubbed.platform, secret_values);
    scrubbed.outcome = redact_text(&scrubbed.outcome, secret_values);
    for variable in &mut scrubbed.environment {
        variable.name = redact_text(&variable.name, secret_values);
        variable.source = redact_text(&variable.source, secret_values);
        variable.state = redact_text(&variable.state, secret_values);
    }
    scrubbed
}

pub fn write_receipt(
    path: &Path,
    receipt: &Receipt,
    secret_values: &[OsString],
) -> Result<(), AppError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            AppError::new(
                70,
                format!(
                    "could not create receipt directory {}: {error}",
                    redact_argument(parent.as_os_str(), secret_values)
                ),
            )
        })?;
    }
    let json = serde_json::to_vec_pretty(&scrub_receipt(receipt, secret_values))
        .map_err(|error| AppError::new(70, format!("could not serialize receipt: {error}")))?;
    fs::write(path, json).map_err(|error| {
        AppError::new(
            70,
            format!(
                "could not write receipt {}: {error}",
                redact_argument(path.as_os_str(), secret_values)
            ),
        )
    })
}

pub fn receipt_environment(preview: &Preview) -> Vec<ReceiptVariable> {
    preview
        .variables
        .iter()
        .map(|item| ReceiptVariable {
            name: item.name.clone(),
            source: item.source.clone(),
            secret: item.secret,
            state: item.state.clone(),
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(input: &str) -> Manifest {
        toml::from_str(input).unwrap()
    }

    #[test]
    fn documented_manifest_is_valid() {
        let manifest = parse(
            r#"version=1
[env.PATH]
inherit=true
[env.CI]
value="true"
[env.TOKEN]
from_env="SOURCE_TOKEN"
secret=true
required=false"#,
        );
        validate_manifest(&manifest).unwrap();
    }

    #[test]
    fn rejects_literal_secret() {
        let manifest = parse("version=1\n[env.TOKEN]\nvalue=\"do-not-store\"\nsecret=true");
        assert!(
            validate_manifest(&manifest)
                .unwrap_err()
                .message
                .contains("literal secrets")
        );
    }

    #[test]
    fn rejects_ambiguous_source() {
        let manifest = parse("version=1\n[env.CI]\nvalue=\"true\"\ninherit=true");
        assert!(
            validate_manifest(&manifest)
                .unwrap_err()
                .message
                .contains("exactly one")
        );
    }

    #[test]
    fn redacts_secret_inside_argument() {
        assert_eq!(
            redact_argument(OsStr::new("--token=abc123"), &[OsString::from("abc123")]),
            "--token=[REDACTED]"
        );
    }

    #[test]
    fn scrubs_declared_secrets_from_every_receipt_string_field() {
        let secret = OsString::from("private-value");
        let receipt = Receipt {
            schema_version: 1,
            id: "id-private-value".to_owned(),
            manifest_sha256: "hash-private-value".to_owned(),
            command: vec!["run-private-value".to_owned()],
            working_directory: "/tmp/private-value".to_owned(),
            platform: "platform-private-value".to_owned(),
            started_unix_ms: 1,
            duration_ms: 2,
            exit_code: Some(0),
            outcome: "outcome-private-value".to_owned(),
            environment: vec![ReceiptVariable {
                name: "name-private-value".to_owned(),
                source: "source-private-value".to_owned(),
                secret: true,
                state: "state-private-value".to_owned(),
            }],
        };

        let json = serde_json::to_string(&scrub_receipt(&receipt, &[secret])).unwrap();
        assert!(!json.contains("private-value"), "{json}");
        assert_eq!(json.matches("[REDACTED]").count(), 9);
    }

    #[test]
    fn scrubs_declared_secrets_from_every_preview_string_field() {
        let secret = OsString::from("private-value");
        let preview = Preview {
            manifest: "/tmp/private-value/clean-env.toml".to_owned(),
            manifest_sha256: "hash-private-value".to_owned(),
            declared: 1,
            removed: 2,
            missing_required: 0,
            variables: vec![PreviewVariable {
                name: "name-private-value".to_owned(),
                source: "source-private-value".to_owned(),
                state: "state-private-value".to_owned(),
                display_value: Some("display-private-value".to_owned()),
                secret: true,
                required: true,
            }],
        };

        let json = serde_json::to_string(&scrub_preview(&preview, &[secret])).unwrap();
        assert!(!json.contains("private-value"), "{json}");
        assert_eq!(json.matches("[REDACTED]").count(), 6);
    }
}
