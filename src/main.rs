use clap::{Parser, Subcommand};
use clean_env_runner::{
    AppError, DEFAULT_MANIFEST, Receipt, STARTER_MANIFEST, default_receipt_path, ensure_complete,
    load_manifest, receipt_environment, receipt_id, redact_argument, resolve_environment,
    unix_ms_now, write_receipt,
};
use serde_json::json;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{self, Command};
use std::time::Instant;

#[derive(Debug, Parser)]
#[command(name = "clean-env", version, about = "Run commands inside an explicit environment boundary", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    /// Write a documented starter manifest
    Init {
        #[arg(short, long, default_value = DEFAULT_MANIFEST)]
        path: PathBuf,
        /// Replace an existing manifest
        #[arg(long)]
        force: bool,
    },
    /// Show exactly what the child environment would contain
    Preview {
        #[arg(short, long, default_value = DEFAULT_MANIFEST)]
        manifest: PathBuf,
        #[arg(long)]
        json: bool,
    },
    /// Validate a manifest and all required inputs
    Check {
        #[arg(short, long, default_value = DEFAULT_MANIFEST)]
        manifest: PathBuf,
        #[arg(long)]
        json: bool,
    },
    /// Clear the ambient environment and run a command
    Run {
        #[arg(short, long, default_value = DEFAULT_MANIFEST)]
        manifest: PathBuf,
        /// Write the scrubbed receipt to this path
        #[arg(long, conflicts_with = "no_receipt")]
        receipt: Option<PathBuf>,
        /// Do not write a run receipt
        #[arg(long)]
        no_receipt: bool,
        /// Print Clean Env Runner's result as JSON
        #[arg(long)]
        json: bool,
        /// Executable and arguments (place after --)
        #[arg(required = true, trailing_var_arg = true, allow_hyphen_values = true)]
        command: Vec<std::ffi::OsString>,
    },
}

fn main() {
    let cli = match Cli::try_parse() {
        Ok(cli) => cli,
        Err(error) => {
            let code = if error.use_stderr() { 64 } else { 0 };
            let _ = error.print();
            process::exit(code);
        }
    };
    if let Err(error) = dispatch(cli) {
        eprintln!("clean-env: {error}");
        process::exit(error.code);
    }
}

fn dispatch(cli: Cli) -> Result<(), AppError> {
    match cli.command {
        Commands::Init { path, force } => init(&path, force),
        Commands::Preview { manifest, json } => preview(&manifest, json),
        Commands::Check { manifest, json } => check(&manifest, json),
        Commands::Run {
            manifest,
            receipt,
            no_receipt,
            json,
            command,
        } => run(&manifest, receipt, no_receipt, json, command),
    }
}

fn init(path: &Path, force: bool) -> Result<(), AppError> {
    let mut options = OpenOptions::new();
    options.write(true);
    if force {
        options.create(true).truncate(true);
    } else {
        options.create_new(true);
    }
    let mut file = options.open(path).map_err(|error| {
        let advice = if error.kind() == std::io::ErrorKind::AlreadyExists {
            "; use --force to replace it"
        } else {
            ""
        };
        AppError::new(
            65,
            format!("could not create {}: {error}{advice}", path.display()),
        )
    })?;
    file.write_all(STARTER_MANIFEST.as_bytes())
        .map_err(|error| {
            AppError::new(70, format!("could not write {}: {error}", path.display()))
        })?;
    println!(
        "Wrote {}\nNext: review it, then run `clean-env preview`.",
        path.display()
    );
    Ok(())
}

fn preview(path: &Path, as_json: bool) -> Result<(), AppError> {
    let (manifest, _, digest) = load_manifest(path)?;
    let environment = resolve_environment(&manifest, path, digest);
    if as_json {
        println!(
            "{}",
            serde_json::to_string_pretty(&environment.preview)
                .map_err(|e| AppError::new(70, e.to_string()))?
        );
    } else {
        println!("ENVIRONMENT PROOF  {}", path.display());
        println!(
            "{} declared · {} ambient removed · {} required missing\n",
            environment.preview.declared,
            environment.preview.removed,
            environment.preview.missing_required
        );
        if environment.preview.variables.is_empty() {
            println!("(empty) The child receives no environment variables.");
        }
        for item in &environment.preview.variables {
            let value = item.display_value.as_deref().unwrap_or("—");
            println!(
                "{:<10} {:<24} {:<18} {}",
                item.state.to_uppercase(),
                item.name,
                item.source,
                value
            );
        }
    }
    Ok(())
}

fn check(path: &Path, as_json: bool) -> Result<(), AppError> {
    let (manifest, _, digest) = load_manifest(path)?;
    let environment = resolve_environment(&manifest, path, digest);
    if let Err(error) = ensure_complete(&environment) {
        if as_json {
            println!(
                "{}",
                json!({"ok": false, "error": error.message, "preview": environment.preview})
            );
        }
        return Err(error);
    }
    if as_json {
        println!("{}", json!({"ok": true, "preview": environment.preview}));
    } else {
        println!(
            "Manifest valid. {} variables declared; all required inputs are available.",
            environment.preview.declared
        );
    }
    Ok(())
}

fn run(
    path: &Path,
    receipt_path: Option<PathBuf>,
    no_receipt: bool,
    as_json: bool,
    arguments: Vec<std::ffi::OsString>,
) -> Result<(), AppError> {
    let (manifest, _, digest) = load_manifest(path)?;
    let environment = resolve_environment(&manifest, path, digest.clone());
    ensure_complete(&environment)?;
    let started_ms = unix_ms_now();
    let id = receipt_id(started_ms);
    let timer = Instant::now();
    let mut child = Command::new(&arguments[0]);
    child.args(&arguments[1..]);
    child.env_clear();
    for (name, value) in &environment.values {
        child.env(name, value);
    }
    let safe_program = redact_argument(&arguments[0], &environment.secret_values);
    let status = child.status().map_err(|error| {
        AppError::new(70, format!("could not execute {safe_program:?}: {error}"))
    })?;
    let duration_ms = timer.elapsed().as_millis();
    let exit_code = status.code();
    let outcome = if status.success() {
        "success"
    } else {
        "failure"
    }
    .to_owned();
    let command = arguments
        .iter()
        .map(|arg| redact_argument(arg, &environment.secret_values))
        .collect();
    let cwd = std::env::current_dir()
        .map_err(|e| AppError::new(70, format!("could not read current directory: {e}")))?;
    let receipt = Receipt {
        schema_version: 1,
        id: id.clone(),
        manifest_sha256: digest,
        command,
        working_directory: cwd.display().to_string(),
        platform: std::env::consts::OS.to_owned(),
        started_unix_ms: started_ms,
        duration_ms,
        exit_code,
        outcome: outcome.clone(),
        environment: receipt_environment(&environment.preview),
    };
    let written_path = if no_receipt {
        None
    } else {
        let path = receipt_path.unwrap_or_else(|| default_receipt_path(&id));
        write_receipt(&path, &receipt)?;
        Some(path)
    };
    if as_json {
        println!(
            "{}",
            json!({"outcome": outcome, "exit_code": exit_code, "duration_ms": duration_ms, "receipt": written_path})
        );
    } else if let Some(path) = &written_path {
        eprintln!("clean-env: {outcome}; receipt {}", path.display());
    } else {
        eprintln!("clean-env: {outcome}; receipt disabled");
    }
    process::exit(exit_code.unwrap_or(70));
}
