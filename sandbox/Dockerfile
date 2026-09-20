FROM rust:1-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends coreutils util-linux \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /server
COPY worker/Cargo.toml ./Cargo.toml
COPY worker/src ./src
RUN cargo build --release && cp target/release/zf-worker /usr/local/bin/zf-worker && rm -rf target

WORKDIR /work
COPY harness/Cargo.toml ./Cargo.toml
COPY harness/src ./src
RUN mkdir -p tests && cp src/lib.rs /work/baseline_lib.rs

RUN cargo fetch
RUN cargo test --no-run

ENV PORT=8080
EXPOSE 8080
CMD ["zf-worker"]
