#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::BytesN as _, BytesN, Env};

fn setup() -> (Env, RegistryClient<'static>) {
    let env = Env::default();
    let id = env.register(Registry, ());
    let client = RegistryClient::new(&env, &id);
    (env, client)
}

#[test]
fn records_and_reads_back() {
    let (env, client) = setup();
    let wasm: BytesN<32> = BytesN::random(&env);
    let result: BytesN<32> = BytesN::random(&env);

    let audit = client.record(&wasm, &result, &true, &3);
    assert!(audit.passed);
    assert_eq!(audit.lanes, 3);

    let stored = client.get(&wasm).unwrap();
    assert_eq!(stored.result_hash, result);
    assert!(stored.passed);
}

#[test]
fn unknown_contract_is_not_audited() {
    let (env, client) = setup();
    let wasm: BytesN<32> = BytesN::random(&env);
    assert!(!client.is_audited(&wasm));
    assert!(client.get(&wasm).is_none());
}

#[test]
fn failing_scan_is_not_audited() {
    let (env, client) = setup();
    let wasm: BytesN<32> = BytesN::random(&env);
    let result: BytesN<32> = BytesN::random(&env);

    client.record(&wasm, &result, &false, &2);
    assert!(!client.is_audited(&wasm));
}

#[test]
fn rescan_overwrites_previous_result() {
    let (env, client) = setup();
    let wasm: BytesN<32> = BytesN::random(&env);
    let first: BytesN<32> = BytesN::random(&env);
    let second: BytesN<32> = BytesN::random(&env);

    client.record(&wasm, &first, &false, &2);
    assert!(!client.is_audited(&wasm));

    client.record(&wasm, &second, &true, &3);
    assert!(client.is_audited(&wasm));
    assert_eq!(client.get(&wasm).unwrap().result_hash, second);
}
