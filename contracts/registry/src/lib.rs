#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, BytesN, Env, Symbol};

const DAY: u32 = 17280;
const TTL_THRESHOLD: u32 = DAY;
const TTL_EXTEND: u32 = 30 * DAY;

#[contracttype]
pub enum Key {
    Audit(BytesN<32>),
}

#[contracttype]
#[derive(Clone)]
pub struct Audit {
    pub result_hash: BytesN<32>,
    pub passed: bool,
    pub lanes: u32,
    pub ledger: u32,
}

#[contract]
pub struct Registry;

#[contractimpl]
impl Registry {
    pub fn record(env: Env, wasm_hash: BytesN<32>, result_hash: BytesN<32>, passed: bool, lanes: u32) -> Audit {
        let audit = Audit {
            result_hash,
            passed,
            lanes,
            ledger: env.ledger().sequence(),
        };
        let key = Key::Audit(wasm_hash);
        env.storage().persistent().set(&key, &audit);
        env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events().publish((Symbol::new(&env, "audit"), passed), audit.clone());
        audit
    }

    pub fn get(env: Env, wasm_hash: BytesN<32>) -> Option<Audit> {
        let key = Key::Audit(wasm_hash);
        let found: Option<Audit> = env.storage().persistent().get(&key);
        if found.is_some() {
            env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        }
        found
    }

    pub fn is_audited(env: Env, wasm_hash: BytesN<32>) -> bool {
        match Self::get(env, wasm_hash) {
            Some(a) => a.passed,
            None => false,
        }
    }
}

mod test;
