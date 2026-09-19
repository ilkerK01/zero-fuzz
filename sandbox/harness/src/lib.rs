#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum Key {
    Amount(Address),
}

#[contract]
pub struct RegistryPool;

#[contractimpl]
impl RegistryPool {
    pub fn set_amount(env: Env, user: Address, amount: i128) {
        user.require_auth();
        env.storage().temporary().set(&Key::Amount(user.clone()), &amount);
    }

    pub fn read_amount(env: Env, user: Address) -> i128 {
        env.storage()
            .temporary()
            .get(&Key::Amount(user.clone()))
            .unwrap_or(0)
    }
}
