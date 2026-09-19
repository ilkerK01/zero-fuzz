FROM rust:1-slim

WORKDIR /work
COPY harness/Cargo.toml ./Cargo.toml
COPY harness/src ./src
RUN mkdir -p tests

RUN cargo fetch
RUN cargo test --no-run

CMD ["cargo", "test", "--offline", "--color", "always"]
