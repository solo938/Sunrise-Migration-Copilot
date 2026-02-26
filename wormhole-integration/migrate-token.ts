// migrate-token.ts
// Wormhole Native Token Transfer (NTT) — EVM → Solana
// Official SDK: https://wormhole.com/docs/tools/typescript-sdk/get-started/
// Run: npx tsx migrate-token.ts

import { wormhole, amount, Chain, Network } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";

// ── Config — edit these before running ────────────────────────────────
const CONFIG = {
  // "Testnet" for Sepolia→devnet, "Mainnet" for production
  network: "Testnet" as Network,

  source: {
    chain: "Sepolia" as Chain,
    // Your ERC-20 token contract address on the source chain
    tokenAddress: process.env.EVM_TOKEN_ADDRESS ?? "0xYourERC20AddressHere",
    // NTT Manager contract deployed on EVM (from `wormhole ntt init`)
    nttManager: process.env.EVM_NTT_MANAGER ?? "0xYourNTTManagerAddress",
    // Wormhole Transceiver on EVM
    transceiver: process.env.EVM_TRANSCEIVER ?? "0xYourTransceiverAddress",
    // EVM private key (never commit to git — use env var)
    privateKey: process.env.EVM_PRIVATE_KEY ?? "",
  },

  destination: {
    chain: "Solana" as Chain,
    // Recipient Solana wallet address
    recipientAddress: process.env.SOLANA_RECIPIENT ?? "YourSolanaWalletAddressHere",
    // NTT Hub program ID on Solana (from `wormhole ntt init`)
    nttProgramId: process.env.SOLANA_NTT_PROGRAM_ID ?? "YourNTTProgramIdHere",
    // Solana keypair JSON path (default: ~/.config/solana/id.json)
    keypairPath: process.env.SOLANA_KEYPAIR_PATH ?? `${process.env.HOME}/.config/solana/id.json`,
  },

  transfer: {
    // Amount to transfer in human-readable form (e.g. "100.5")
    amount: process.env.TRANSFER_AMOUNT ?? "10.0",
    // Token decimals on the EVM side (usually 18)
    decimals: Number(process.env.TOKEN_DECIMALS ?? 18),
    // true  = Wormhole relayer handles destination tx (costs more, no manual step)
    // false = you must call completeTransfer() yourself (shown below)
    automaticRelay: false,
    // Timeout (ms) waiting for Guardian attestation
    attestationTimeout: 120_000,
  },
} as const;

// ── Logger ────────────────────────────────────────────────────────────
function log(msg: string, data?: unknown) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${ts}] ${msg}`);
  if (data !== undefined) console.log(JSON.stringify(data, null, 2));
}

function logSection(title: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

// ── Validate config ───────────────────────────────────────────────────
function validateConfig() {
  const errors: string[] = [];
  if (!CONFIG.source.privateKey)
    errors.push("EVM_PRIVATE_KEY env var is required");
  if (CONFIG.source.tokenAddress.includes("Your"))
    errors.push("Set EVM_TOKEN_ADDRESS (or update CONFIG.source.tokenAddress)");
  if (CONFIG.source.nttManager.includes("Your"))
    errors.push("Set EVM_NTT_MANAGER (or update CONFIG.source.nttManager)");
  if (CONFIG.destination.recipientAddress.includes("Your"))
    errors.push("Set SOLANA_RECIPIENT (or update CONFIG.destination.recipientAddress)");
  if (errors.length > 0) {
    console.error("\n❌ Configuration errors:");
    errors.forEach((e) => console.error(`   • ${e}`));
    console.error("\nSet environment variables or edit CONFIG in migrate-token.ts\n");
    process.exit(1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  logSection("Sunrise Migration Copilot — Wormhole NTT Transfer");
  log(`Network:        ${CONFIG.network}`);
  log(`Source chain:   ${CONFIG.source.chain}`);
  log(`Dest chain:     ${CONFIG.destination.chain}`);
  log(`Token:          ${CONFIG.source.tokenAddress}`);
  log(`Amount:         ${CONFIG.transfer.amount} (${CONFIG.transfer.decimals} decimals)`);
  log(`Recipient:      ${CONFIG.destination.recipientAddress}`);
  log(`Auto relay:     ${CONFIG.transfer.automaticRelay}`);

  validateConfig();

  // ── Step 1: Initialize Wormhole SDK ─────────────────────────────────
  logSection("Step 1 — Initialize Wormhole SDK");
  log("Loading platform modules: evm, solana...");

  const wh = await wormhole(CONFIG.network, [evm, solana]);
  log("SDK initialized ✓");

  // ── Step 2: Get chain contexts ───────────────────────────────────────
  logSection("Step 2 — Chain Contexts");

  const srcChain = wh.getChain(CONFIG.source.chain);
  const dstChain = wh.getChain(CONFIG.destination.chain);

  log(`Source — chain ID: ${srcChain.config.chainId}, RPC: ${srcChain.config.rpc}`);
  log(`Dest   — chain ID: ${dstChain.config.chainId}, RPC: ${dstChain.config.rpc}`);

  // ── Step 3: Build signers ────────────────────────────────────────────
  logSection("Step 3 — Signers");

  // EVM signer from private key
  log("Creating EVM signer from EVM_PRIVATE_KEY...");
  // NOTE: In production use ethers.js Wallet or viem WalletClient.
  // The Wormhole SDK accepts any object implementing the SignAndSendSigner interface.
  // Example with ethers (add `npm install ethers` if needed):
  //
  // import { ethers } from "ethers";
  // const provider = new ethers.JsonRpcProvider(srcChain.config.rpc);
  // const evmWallet = new ethers.Wallet(CONFIG.source.privateKey, provider);
  // const evmSigner = await srcChain.getSigner(evmWallet);
  //
  // For this demo script we demonstrate the pattern without executing:
  const evmSignerPlaceholder = {
    chain: () => CONFIG.source.chain,
    address: () => "0xDemoEvmAddress",
  };
  log(`EVM signer address: ${evmSignerPlaceholder.address()} (placeholder — wire up ethers.Wallet)`);

  // Solana signer from keypair file
  log(`Loading Solana keypair from: ${CONFIG.destination.keypairPath}`);
  // Example loading keypair:
  //
  // import { readFileSync } from "fs";
  // import { Keypair } from "@solana/web3.js";
  // const kpBytes = JSON.parse(readFileSync(CONFIG.destination.keypairPath, "utf-8"));
  // const solanaKeypair = Keypair.fromSecretKey(new Uint8Array(kpBytes));
  // const solanaSigner = await dstChain.getSigner(solanaKeypair);
  //
  const solanaSignerPlaceholder = {
    chain: () => CONFIG.destination.chain,
    address: () => CONFIG.destination.recipientAddress,
  };
  log(`Solana signer address: ${solanaSignerPlaceholder.address()}`);

  // ── Step 4: Build transfer amount ────────────────────────────────────
  logSection("Step 4 — Transfer Amount");

  const transferAmount = amount.units(
    amount.parse(CONFIG.transfer.amount, CONFIG.transfer.decimals)
  );
  log(`Transfer amount (raw units): ${transferAmount.toString()}`);

  // ── Step 5: Initiate NTT transfer ────────────────────────────────────
  logSection("Step 5 — Initiate NTT Transfer (EVM → Solana)");
  log("Building token transfer...");

  // In a live run with real signers, this is the full flow:
  //
  // const xfer = await wh.tokenTransfer(
  //   "ntt",                          // NTT protocol
  //   transferAmount,
  //   srcChain.address(evmSigner.address()),
  //   dstChain.address(CONFIG.destination.recipientAddress),
  //   CONFIG.transfer.automaticRelay
  // );
  //
  // const srcTxids = await xfer.initiateTransfer(evmSigner);
  // log("Source transactions submitted:", srcTxids);

  log("⚠  Demo mode: real transfer requires wiring ethers.Wallet + Solana Keypair signers.");
  log("   See comments in Step 3 above, then uncomment Step 5 code.");

  // ── Step 6: Wait for Wormhole attestation ────────────────────────────
  logSection("Step 6 — Wormhole Guardian Attestation");
  log(`Timeout: ${CONFIG.transfer.attestationTimeout / 1000}s`);
  log("Guardians observe the source chain event and sign a VAA (Verifiable Action Approval).");
  log("On Testnet this typically takes 15–60 seconds.");
  //
  // const attestation = await xfer.fetchAttestation(CONFIG.transfer.attestationTimeout);
  // log("VAA received ✓", attestation);

  // ── Step 7: Complete transfer on Solana ──────────────────────────────
  logSection("Step 7 — Complete Transfer on Solana");

  if (!CONFIG.transfer.automaticRelay) {
    log("Manual relay mode — calling completeTransfer() with Solana signer.");
    //
    // const dstTxids = await xfer.completeTransfer(solanaSigner);
    // log("Solana transactions:", dstTxids);
    // log("✅ Transfer complete! Tokens arrived at:", CONFIG.destination.recipientAddress);
    log("⚠  Demo mode: uncomment completeTransfer() once signers are wired up.");
  } else {
    log("Automatic relay enabled — Wormhole relayer will submit the dest tx automatically.");
    log("Monitor at: https://wormholescan.io/");
  }

  // ── Step 8: Verify on Wormholescan ───────────────────────────────────
  logSection("Step 8 — Verify");
  log("Track your transfer at: https://wormholescan.io/");
  log(`Source chain: ${CONFIG.source.chain} | Dest: Solana`);
  log("Filter by your EVM wallet address or source tx hash.");

  logSection("Done");
  log("NTT migration script complete.");
  log("Next steps:");
  log("  1. Wire up ethers.Wallet for EVM signer (see Step 3)");
  log("  2. Load Solana Keypair from keypair file (see Step 3)");
  log("  3. Uncomment transfer code in Steps 5–7");
  log("  4. Run: npx tsx migrate-token.ts");
  log("  5. Register with Sunrise for liquidity: https://www.sunrisedefi.com/");
}

// ── Helper: show chain info only (no transfer) ────────────────────────
async function showChainInfo() {
  logSection("Chain Info — Wormhole SDK");

  const wh = await wormhole(CONFIG.network, [evm, solana]);

  const chains: Chain[] = ["Sepolia", "Ethereum", "Solana"];
  for (const chainName of chains) {
    try {
      const chain = wh.getChain(chainName);
      log(`${chainName.padEnd(12)} — chainId: ${String(chain.config.chainId).padStart(5)}  rpc: ${chain.config.rpc}`);
    } catch {
      log(`${chainName.padEnd(12)} — not available on ${CONFIG.network}`);
    }
  }
}

// ── Entry point ───────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes("--chain-info")) {
  showChainInfo().catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });
} else {
  main().catch((e) => {
    console.error("\n❌ Transfer failed:", e);
    process.exit(1);
  });
}

// ── Usage ─────────────────────────────────────────────────────────────
//
// Show chain IDs and RPCs only:
//   npx tsx migrate-token.ts --chain-info
//
// Full transfer (after setting env vars):
//   EVM_PRIVATE_KEY=0x... \
//   EVM_TOKEN_ADDRESS=0x... \
//   EVM_NTT_MANAGER=0x... \
//   SOLANA_RECIPIENT=YourWallet \
//   TRANSFER_AMOUNT=100.0 \
//   npx tsx migrate-token.ts
//
// Environment variables:
//   EVM_PRIVATE_KEY         — EVM wallet private key (hex, with 0x)
//   EVM_TOKEN_ADDRESS       — ERC-20 contract address on source chain
//   EVM_NTT_MANAGER         — NTT Manager contract address on EVM
//   EVM_TRANSCEIVER         — Wormhole Transceiver address on EVM
//   SOLANA_RECIPIENT        — Destination Solana wallet address
//   SOLANA_NTT_PROGRAM_ID   — NTT Hub program ID on Solana
//   SOLANA_KEYPAIR_PATH     — Path to Solana keypair JSON file
//   TRANSFER_AMOUNT         — Amount to transfer (e.g. "100.5")
//   TOKEN_DECIMALS          — ERC-20 token decimals (default: 18)
//
// Docs:
//   SDK:  https://wormhole.com/docs/tools/typescript-sdk/get-started/
//   NTT:  https://wormhole.com/docs/products/token-transfers/native-token-transfers/get-started/
//   Scan: https://wormholescan.io/