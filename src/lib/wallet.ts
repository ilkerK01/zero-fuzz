"use client";

import {
  allowAllModules,
  StellarWalletsKit,
  WalletNetwork,
  type ISupportedWallet,
} from "@creit.tech/stellar-wallets-kit";

let kit: StellarWalletsKit | null = null;

function getKit(): StellarWalletsKit {
  if (!kit) {
    kit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      modules: allowAllModules(),
    });
  }
  return kit;
}

export async function connectWallet(): Promise<string> {
  const k = getKit();
  return new Promise<string>((resolve, reject) => {
    k.openModal({
      onWalletSelected: async (wallet: ISupportedWallet) => {
        try {
          k.setWallet(wallet.id);
          const { address } = await k.getAddress();
          resolve(address);
        } catch (e) {
          reject(e);
        }
      },
      onClosed: () => reject(new Error("cancelled")),
    });
  });
}

export async function signChallenge(xdr: string, address: string, networkPassphrase: string) {
  const k = getKit();
  const { signedTxXdr } = await k.signTransaction(xdr, {
    address,
    networkPassphrase,
  });
  return signedTxXdr;
}
