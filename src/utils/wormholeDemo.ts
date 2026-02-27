
// Wormhole TypeScript SDK integration — EVM → Solana token migration

// ── Types ─────────────────────────────────────────────────────────────
export type SupportedSourceChain =
  | "Ethereum"
  | "Sepolia"
  | "Bsc"
  | "Polygon"
  | "Avalanche"
  | "Arbitrum"
  | "Optimism";

export interface TransferConfig {
  network: "Mainnet" | "Testnet";
  sourceChain: SupportedSourceChain;
  tokenAddress: string;   // ERC-20 contract address on source chain
  amount: string;         // Human-readable amount, e.g. "100.0"
  decimals: number;       // Token decimals (usually 18 on EVM)
  recipientSolanaAddress: string;
  automaticRelay?: boolean;
}

export interface MigrationStep {
  stepNumber: number;
  title: string;
  description: string;
  command?: string;
  codeSnippet?: string;
  warning?: string;
  isOptional: boolean;
  docsLink?: string;
}

export interface MigrationPlan {
  steps: MigrationStep[];
  estimatedTime: string;
  requirements: string[];
  sunriseNote: string;
}

// ── SDK initialization snippet (for display) ──────────────────────────
export function getSDKInitSnippet(): string {
  return `// Install:
// npm install @wormhole-foundation/sdk

import { wormhole } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";

// Initialize SDK — works for Mainnet, Testnet, or Devnet
const wh = await wormhole("Testnet", [evm, solana]);

// Inspect chain configuration
const solChain = wh.getChain("Solana");
console.log("Solana chain ID:", solChain.config.chainId);         // 1
console.log("Solana RPC:     ", solChain.config.rpc);             // https://api.devnet.solana.com

const sepolia = wh.getChain("Sepolia");
console.log("Sepolia chain ID:", sepolia.config.chainId);         // 10002
console.log("Sepolia RPC:     ", sepolia.config.rpc);`;
}

// ── NTT transfer snippet ──────────────────────────────────────────────
export function getNTTTransferSnippet(cfg?: Partial<TransferConfig>): string {
  const network = cfg?.network ?? "Testnet";
  const src = cfg?.sourceChain ?? "Sepolia";
  const amount = cfg?.amount ?? "100.0";
  const decimals = cfg?.decimals ?? 18;
  const recipient = cfg?.recipientSolanaAddress ?? "YourSolanaWalletAddressHere";

  return `import { wormhole, amount } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";

// ── 1. Initialize SDK ─────────────────────────────────────────────────
const wh = await wormhole("${network}", [evm, solana]);

// ── 2. Get chain contexts ─────────────────────────────────────────────
const srcChain = wh.getChain("${src}");      // EVM source
const dstChain = wh.getChain("Solana");      // Solana destination

console.log("Source chain ID:", srcChain.config.chainId);
console.log("Dest   chain ID:", dstChain.config.chainId);

// ── 3. Prepare signers ────────────────────────────────────────────────
// EVM signer (replace with your actual wallet provider)
const evmSigner = /* your EVM signer, e.g. from ethers.js or viem */ null as any;
// Solana signer
const solanaSigner = /* your Solana keypair / wallet adapter */ null as any;

// ── 4. Build NTT transfer ─────────────────────────────────────────────
// NTT Manager and Transceiver addresses come from your NTT deployment
const NTT_MANAGER     = "0xYourNTTManagerAddressOnEVM";
const TRANSCEIVER     = "0xYourTransceiverAddressOnEVM";
const TOKEN_ADDRESS   = "${cfg?.tokenAddress ?? "0xYourERC20AddressHere"}";

// Amount to transfer — use Wormhole's amount helper
const transferAmount = amount.units(amount.parse("${amount}", ${decimals}));

// ── 5. Initiate transfer (lock tokens on EVM) ─────────────────────────
const xfer = await wh.tokenTransfer(
  "ntt",                   // protocol: "ntt" for Native Token Transfers
  transferAmount,
  srcChain.address(await evmSigner.getAddress()),
  dstChain.address("${recipient}"),
  ${cfg?.automaticRelay ?? false}               // automaticRelay: true = relayer pays gas on dest
);

// Execute the source-side transaction
const srcTxids = await xfer.initiateTransfer(evmSigner);
console.log("Transfer initiated. Source tx IDs:", srcTxids);

// ── 6. Wait for Wormhole attestation (Guardian signatures) ────────────
console.log("Waiting for attestation (up to 60s on testnet)...");
const attestation = await xfer.fetchAttestation(60_000);
console.log("Attestation received:", attestation);

// ── 7. Complete transfer (mint tokens on Solana) ──────────────────────
const dstTxids = await xfer.completeTransfer(solanaSigner);
console.log("Transfer complete. Solana tx IDs:", dstTxids);`;
}

// ── Wrapped token transfer snippet ────────────────────────────────────
export function getWrappedTransferSnippet(): string {
  return `// Wrapped Token Transfer (WTT) — alternative to NTT
// Use this if you want wrapped/bridged tokens rather than native
import { wormhole, amount } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";

const wh = await wormhole("Testnet", [evm, solana]);

const sendChain = wh.getChain("Sepolia");
const rcvChain  = wh.getChain("Solana");

// Automatic transfer (relayer handles destination tx — costs a bit more)
const xfer = await wh.tokenTransfer(
  "TokenBridge",   // WTT protocol
  amount.units(amount.parse("1.0", 18)),
  sendChain.address(evmSenderAddress),
  rcvChain.address(solanaRecipientAddress),
  true             // automatic = true → no need to call completeTransfer
);

const [srcTxId] = await xfer.initiateTransfer(evmSigner);
console.log("Source tx:", srcTxId);
// Done — relayer completes on Solana automatically`;
}

// ── Static migration plan ─────────────────────────────────────────────
export function buildMigrationPlan(
  _tokenName: string,
  isERC20: boolean,
  _isERC721: boolean
): MigrationPlan {
  const steps: MigrationStep[] = [
    {
      stepNumber: 1,
      title: "Install Wormhole TypeScript SDK",
      description:
        "Install the unified SDK which includes EVM and Solana platform support. A single npm install gives you everything you need.",
      command: `npm install @wormhole-foundation/sdk
# Platform-specific (included in the main package, but installable separately):
npm install @wormhole-foundation/sdk-evm @wormhole-foundation/sdk-solana`,
      codeSnippet: getSDKInitSnippet(),
      isOptional: false,
      docsLink: "https://wormhole.com/docs/tools/typescript-sdk/get-started/",
    },
    {
      stepNumber: 2,
      title: "Snapshot EVM token holders",
      description:
        "Export the complete holder list with balances from your EVM chain. This is the source of truth for SPL token distribution.",
      command: `# Using cast (foundry) to read balanceOf holders:
cast call <TOKEN_ADDRESS> "totalSupply()(uint256)" --rpc-url $ETH_RPC

# Or use a block explorer API / The Graph subgraph to get all Transfer events
# → output: holders.json [{evmAddress, balance}]`,
      isOptional: false,
    },
    {
      stepNumber: 3,
      title: "Deploy SPL Token mint on Solana",
      description: isERC20
        ? "Create an SPL Token mint (or Token-2022 for extensions like transfer fees, metadata, etc.) that matches your ERC-20 decimals."
        : "Create a Token-2022 mint. For NFTs, you will create per-item mints with supply=1 via Metaplex.",
      command: `# Using spl-token CLI
spl-token create-token --decimals 9

# Save the mint address
export MINT=$(spl-token create-token --decimals 9 | grep "Creating token" | awk '{print $3}')
echo "Mint: $MINT"`,
      codeSnippet: `// Using @solana/spl-token npm package
import { createMint } from "@solana/spl-token";
import { Connection, Keypair } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const payer = Keypair.generate(); // load your actual keypair

const mint = await createMint(
  connection,
  payer,
  payer.publicKey,   // mint authority
  payer.publicKey,   // freeze authority (set null to disable)
  9                  // decimals — match your ERC-20
);
console.log("Mint:", mint.toBase58());`,
      isOptional: false,
    },
    {
      stepNumber: 4,
      title: "Configure Wormhole NTT",
      description:
        "Deploy NTT Manager and Transceiver contracts on EVM, then register the Solana SPL mint as the destination. NTT enables lock-and-mint or burn-and-mint bridging.",
      command: `# Install Wormhole CLI
npm install -g @wormhole-foundation/cli

# Deploy NTT on EVM (Sepolia for testnet)
wormhole ntt init --chain sepolia --token <ERC20_ADDRESS> --mode locking

# Deploy NTT Hub on Solana (devnet for testnet)
wormhole ntt init --chain solana --token <MINT_ADDRESS> --mode burning`,
      warning:
        "NTT deployment costs $200–$800 in ETH gas on Ethereum mainnet. Test thoroughly on Sepolia testnet first.",
      docsLink:
        "https://wormhole.com/docs/products/token-transfers/native-token-transfers/get-started/",
      isOptional: false,
    },
    {
      stepNumber: 5,
      title: "Test NTT transfer on testnet",
      description:
        "Run a complete end-to-end transfer from Sepolia to Solana devnet using the TypeScript SDK. Verify the token arrives on the destination wallet.",
      codeSnippet: getNTTTransferSnippet({
        network: "Testnet",
        sourceChain: "Sepolia",
        amount: "10.0",
        decimals: 18,
        recipientSolanaAddress: "YourDevnetSolanaWallet",
      }),
      isOptional: false,
      docsLink: "https://wormhole.com/docs/tools/typescript-sdk/sdk-reference/",
    },
    {
      stepNumber: 6,
      title: "Register with Sunrise for native liquidity",
      description:
        "Sunrise is the canonical gateway for new assets entering Solana with day-one liquidity. After bridging, register your token through Sunrise to access AMM routing.",
      codeSnippet: `// Sunrise integration — contact @Sunrise_DeFi on X or apply at sunrisedefi.com
// Sunrise routes your bridged token through:
//   1. Orca / Raydium AMM pool creation
//   2. Liquidity bootstrapping event
//   3. Price discovery

// Reference: Wormhole NTT + Sunrise architecture
// Your token → Wormhole NTT bridge → Solana SPL mint → Sunrise liquidity pool`,
      warning: "Sunrise does not yet have a public permissionless SDK. Apply via sunrisedefi.com.",
      isOptional: false,
    },
    {
      stepNumber: 7,
      title: "Distribute SPL tokens to holders",
      description:
        "Use the snapshot to create ATAs and distribute tokens to mapped Solana wallets. Run on devnet first with a small batch.",
      command: `# Install distribution dependencies
npm install @solana/spl-token @solana/web3.js`,
      codeSnippet: `import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const holders = require("./holders.json");  // [{solanaAddress, balance}]

for (const holder of holders) {
  try {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payerKeypair,
      new PublicKey(MINT_ADDRESS),
      new PublicKey(holder.solanaAddress)
    );
    await mintTo(
      connection,
      payerKeypair,
      new PublicKey(MINT_ADDRESS),
      ata.address,
      mintAuthorityKeypair,
      BigInt(holder.balance)
    );
    console.log(\`Distributed to \${holder.solanaAddress}\`);
  } catch (err) {
    console.error(\`Failed for \${holder.solanaAddress}:\`, err);
  }
}`,
      warning:
        "You must collect an EVM address → Solana wallet mapping before running distribution. Consider building a claim portal.",
      isOptional: false,
    },
    {
      stepNumber: 8,
      title: "Revoke mint authority",
      description:
        "Once distribution is complete, revoke the mint authority to make the total supply provably fixed. This builds trust with holders.",
      command: `spl-token authorize $MINT mint --disable
# Verify:
spl-token display $MINT | grep "Mint authority"
# Should show: (not set)`,
      isOptional: true,
    },
    {
      stepNumber: 9,
      title: "Deploy liquidity pool (Orca / Raydium)",
      description:
        "Create an AMM pool pairing your token with SOL, USDC, or another liquid asset. Provides immediate on-chain trading capability.",
      codeSnippet: `// Using @orca-so/whirlpools-sdk
import {
  WhirlpoolContext,
  buildWhirlpoolClient,
  ORCA_WHIRLPOOLS_CONFIG,
  PriceMath,
} from "@orca-so/whirlpools-sdk";
import { AnchorProvider } from "@coral-xyz/anchor";

const provider = AnchorProvider.env();
const ctx = WhirlpoolContext.from(
  provider.connection,
  provider.wallet,
  ORCA_WHIRLPOOLS_CONFIG
);
const client = buildWhirlpoolClient(ctx);

// Pool: YOUR_TOKEN / USDC at 0.3% fee tier (tick_spacing = 64)
const { poolKey, tx } = await client.createPool(
  tokenAMint,       // your SPL mint
  tokenBMint,       // USDC mint
  64,               // tick spacing (0.3% fee tier)
  initialSqrtPrice, // use PriceMath.priceToSqrtPriceX64(...)
  wallet.publicKey
);
await tx.buildAndExecute();
console.log("Pool created:", poolKey.toBase58());`,
      isOptional: true,
    },
  ];

  return {
    steps,
    estimatedTime: "2–5 days (testnet) · 1–2 weeks (mainnet)",
    requirements: [
      "Node.js 18+ with npm",
      "@wormhole-foundation/sdk installed",
      "Solana CLI + wallet with SOL (devnet: solana airdrop 2)",
      "EVM RPC endpoint (Alchemy / Infura) + funded wallet for gas",
      "EVM token holder snapshot (JSON)",
      "EVM address → Solana wallet mapping",
    ],
    sunriseNote:
      "Sunrise acts as the canonical liquidity router for newly bridged assets on Solana. By routing through Sunrise (powered by Wormhole NTT), your token gets immediate on-chain liquidity without bootstrapping from scratch. Apply at sunrisedefi.com or DM @Sunrise_DeFi on X.",
  };
}

// ── Architecture diagram (ASCII) ──────────────────────────────────────
export const ARCHITECTURE_DIAGRAM = `
  EVM Source Chain (Ethereum / L2)              Solana
  ┌──────────────────────────────┐              ┌─────────────────────────────────────┐
  │                              │              │                                     │
  │  ERC-20 Contract             │ Wormhole NTT │  SPL Token Mint                     │
  │  ┌──────────────────┐        │ ──────────▶  │  ┌────────────────┐                 │
  │  │  lock / burn     │        │  VAA + relay │  │  mint / unlock │                 │
  │  └──────────────────┘        │              │  └───────┬────────┘                 │
  │                              │              │          │                          │
  │  NTT Manager                 │              │  ┌───────▼────────┐                 │
  │  ┌──────────────────┐        │              │  │ Sunrise DEX    │                 │
  │  │ rate limiting    │        │              │  │ liquidity pool │                 │
  │  │ transceiver      │        │              │  └────────────────┘                 │
  │  └──────────────────┘        │              │                                     │
  │                              │              │  Anchor Program (your dApp)         │
  └──────────────────────────────┘              │  ┌─────────────────────────────┐    │
                                                │  │  PDAs · instructions · CPI  │    │
                                                │  └─────────────────────────────┘    │
                                                └─────────────────────────────────────┘

  Wormhole SDK init:
    const wh = await wormhole("Testnet", [evm, solana]);
    //                         ^network   ^platform modules
`;
