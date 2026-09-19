#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum Key {
    Amount(Address),
    Mirror(Address),
}

#[contract]
pub struct RegistryPool;

#[contractimpl]
impl RegistryPool {
    pub fn set_amount(env: Env, user: Address, amount: i128) {
        user.require_auth();
        env.storage().temporary().set(&Key::Amount(user.clone()), &amount);
        env.storage().persistent().set(&Key::Mirror(user.clone()), &amount);
    }

    pub fn read_amount(env: Env, user: Address) -> i128 {
        match env.storage().temporary().get(&Key::Amount(user.clone())) {
            Some(v) => v,
            None => env
                .storage()
                .persistent()
                .get(&Key::Mirror(user.clone()))
                .unwrap_or(0),
        }
    }

    pub fn borrow_limit(env: Env, user: Address) -> i128 {
        Self::read_amount(env, user) * 4
    }
}
