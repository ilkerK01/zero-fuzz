use std::fs;
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};

use serde::{Deserialize, Serialize};
use tiny_http::{Header, Response, Server};

const CRATE_DIR: &str = "/work";
const BASELINE: &str = "/work/baseline_lib.rs";
const TIMEOUT_SECS: &str = "90";

static BUSY: AtomicBool = AtomicBool::new(false);

#[derive(Deserialize)]
struct RunRequest {
    test: String,
    #[serde(default)]
    contract: Option<String>,
}

#[derive(Serialize)]
struct RunResponse {
    output: String,
    isolated: bool,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

fn json_header() -> Header {
    Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap()
}

fn supports_netns() -> bool {
    Command::new("unshare")
        .args(["-rn", "true"])
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

fn restore_baseline() {
    if let Ok(src) = fs::read_to_string(BASELINE) {
        let _ = fs::write(format!("{CRATE_DIR}/src/lib.rs"), src);
    }
}

fn run_tests(req: &RunRequest, isolated: bool) -> std::io::Result<String> {
    if let Some(contract) = &req.contract {
        fs::write(format!("{CRATE_DIR}/src/lib.rs"), contract)?;
    } else {
        restore_baseline();
    }
    fs::create_dir_all(format!("{CRATE_DIR}/tests"))?;
    fs::write(format!("{CRATE_DIR}/tests/gen.rs"), &req.test)?;

    let mut command = if isolated {
        let mut c = Command::new("unshare");
        c.args(["-rn", "timeout", TIMEOUT_SECS, "cargo", "test", "--offline", "--color", "never"]);
        c
    } else {
        let mut c = Command::new("timeout");
        c.args([TIMEOUT_SECS, "cargo", "test", "--offline", "--color", "never"]);
        c
    };

    let out = command
        .current_dir(CRATE_DIR)
        .env("CARGO_TERM_COLOR", "never")
        .output()?;

    restore_baseline();

    let mut combined = String::from_utf8_lossy(&out.stdout).to_string();
    combined.push('\n');
    combined.push_str(&String::from_utf8_lossy(&out.stderr));
    Ok(combined)
}

fn main() {
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let key = std::env::var("ZF_WORKER_KEY").unwrap_or_default();
    let isolated = supports_netns();

    eprintln!("zf-worker listening on {port}, network isolation: {isolated}");

    let server = Server::http(format!("0.0.0.0:{port}")).expect("bind failed");

    for mut request in server.incoming_requests() {
        let path = request.url().split('?').next().unwrap_or("/").to_string();
        let method = request.method().as_str().to_string();

        if method == "GET" && (path == "/health" || path == "/") {
            let body = serde_json::json!({ "ok": true, "isolated": isolated }).to_string();
            let _ = request.respond(Response::from_string(body).with_header(json_header()));
            continue;
        }

        if method != "POST" || path != "/run" {
            let body = serde_json::to_string(&ErrorResponse { error: "not found".into() }).unwrap();
            let _ = request.respond(
                Response::from_string(body).with_status_code(404).with_header(json_header()),
            );
            continue;
        }

        let provided = request
            .headers()
            .iter()
            .find(|h| h.field.equiv("x-zf-key"))
            .map(|h| h.value.as_str().to_string())
            .unwrap_or_default();

        if key.is_empty() || provided != key {
            let body = serde_json::to_string(&ErrorResponse { error: "unauthorized".into() }).unwrap();
            let _ = request.respond(
                Response::from_string(body).with_status_code(401).with_header(json_header()),
            );
            continue;
        }

        if BUSY.swap(true, Ordering::SeqCst) {
            let body = serde_json::to_string(&ErrorResponse {
                error: "another scan is already running".into(),
            })
            .unwrap();
            let _ = request.respond(
                Response::from_string(body).with_status_code(429).with_header(json_header()),
            );
            continue;
        }

        let mut raw = String::new();
        let read_ok = request.as_reader().read_to_string(&mut raw).is_ok();

        let reply = if !read_ok {
            Response::from_string(
                serde_json::to_string(&ErrorResponse { error: "could not read body".into() }).unwrap(),
            )
            .with_status_code(400)
            .with_header(json_header())
        } else {
            match serde_json::from_str::<RunRequest>(&raw) {
                Err(_) => Response::from_string(
                    serde_json::to_string(&ErrorResponse {
                        error: "body must be {\"test\": string, \"contract\": string?}".into(),
                    })
                    .unwrap(),
                )
                .with_status_code(400)
                .with_header(json_header()),
                Ok(parsed) => match run_tests(&parsed, isolated) {
                    Ok(output) => Response::from_string(
                        serde_json::to_string(&RunResponse { output, isolated }).unwrap(),
                    )
                    .with_header(json_header()),
                    Err(e) => {
                        restore_baseline();
                        Response::from_string(
                            serde_json::to_string(&ErrorResponse { error: e.to_string() }).unwrap(),
                        )
                        .with_status_code(500)
                        .with_header(json_header())
                    }
                },
            }
        };

        BUSY.store(false, Ordering::SeqCst);
        let _ = request.respond(reply);
    }
}
