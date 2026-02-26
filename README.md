<div align="center">

<img src="https://img.shields.io/badge/-%E2%98%80%20SUNRISE%20MIGRATION%20COPILOT-f79320?style=for-the-badge&labelColor=0a0a0f&color=f79320" alt="Sunrise Migration Copilot" height="40"/>

<br/><br/>

**Migrate any Ethereum smart contract to Solana — automatically.**  
Parse → Map → Generate → Bridge → Export. All in one tool.

<br/>

[![Built for Solana Graveyard Hackathon](https://img.shields.io/badge/Built%20for-Solana%20Graveyard%20Hackathon-19fb9b?style=flat-square&logo=solana&logoColor=white&labelColor=0d0d16)](https://solana.com/graveyard-hack)
[![Solana](https://img.shields.io/badge/Solana-Devnet%20Ready-19fb9b?style=flat-square&logo=solana&logoColor=19fb9b&labelColor=0d0d16)](https://solana.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=flat-square&logo=typescript&labelColor=0d0d16)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&labelColor=0d0d16)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite&labelColor=0d0d16)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-f79320?style=flat-square&labelColor=0d0d16)](LICENSE)

<br/>

```
  ☀ Sunrise Migration Copilot
  ═══════════════════════════════════════════════════════
  Upload .sol  →  Parse  →  Map  →  Anchor  →  Bridge  →  Report
  ═══════════════════════════════════════════════════════
       EVM                              Solana + Sunrise
```

<br/>

[**→ Live Demo**](#-live-demo) · [**→ Quick Start**](#-quick-start) · [**→ Features**](#-features) · [**→ Architecture**](#-architecture) · [**→ Wormhole NTT**](#-wormhole-ntt-bridge)

</div>

---

## 🧭 What is this?

EVM → Solana migration is notoriously painful. You're not just translating syntax — you're rethinking **account models**, **storage layouts**, **token standards**, and **deployment toolchains** from scratch.

**Sunrise Migration Copilot** automates the scaffolding work. Upload any `.sol` file and get:

- 📐 A complete **Anchor program skeleton** ready for `anchor build`
- 🗺 **20+ rule-based mappings** from EVM concepts → Solana equivalents, with Rust snippets
- 🚀 An **animated Wormhole NTT bridge demo** (Sepolia → Solana Devnet)
- ⚡ A **4-tab performance dashboard** quantifying why you're migrating
- 📄 A **one-click exportable report** (Markdown + PDF) for your team or Sunrise liquidity application

> **Built for the [Solana Graveyard Hackathon](https://solana.com/graveyard-hack).** Post-migration, Sunrise acts as the canonical liquidity router — bootstrapping day-one AMM pools for newly bridged assets so you never start from zero.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔍 Solidity Parser
Zero-dependency regex parser extracts your entire contract structure — functions, state variables, events, modifiers, inheritance — without `solc-js` bloating your bundle.

**Detects automatically:**
- ERC-20 / ERC-721 / custom standards
- `Ownable` / `AccessControl` patterns  
- `mapping()` state variables (→ PDA candidates)
- All `require()` statements (→ error codes)
- Complexity score: `low` / `medium` / `high`

</td>
<td width="50%">

### 🗺 Mapping Engine
Rule-based engine with **6 categories** covering every major EVM concept:

| EVM | → | Solana |
|-----|---|--------|
| `mapping(addr ⇒ uint)` | → | PDA per key |
| `Ownable` | → | `has_one = authority` |
| `emit Transfer()` | → | `#[event]` + `emit!()` |
| `ERC-20` | → | SPL Token |
| `ERC-721` | → | Metaplex NFT |
| `require(cond, msg)` | → | `#[error_code]` |

</td>
</tr>
<tr>
<td width="50%">

### ⚓ Anchor Skeleton Generator
Produces a **compilable Anchor project** tailored to your contract:

```
programs/
  your_program/
    src/
      lib.rs          ← full instruction stubs
      error.rs        ← typed error codes
Anchor.toml           ← cluster config
Cargo.toml            ← dependencies
tests/
  your_program.ts     ← mocha scaffolding
```

Account space is calculated **byte-accurately** per field with a 64-byte safety buffer.

</td>
<td width="50%">

### 🚀 Live Testnet Bridge Demo
Full **Wormhole NTT** animation (no static slides):

```
① Connect SDK       ✓ wormhole('Testnet', [evm, solana])
② Approve Token     ✓ ERC-20 approve() → NTT Manager
③ Lock on Sepolia   ✓ 0x4a7f...c3e2 → Etherscan ↗
④ Guardian Attest   ✓ 13/19 VAA signed · seq: 84921
⑤ Mint on Solana    ✓ 5yWf...Kvu → Explorer ↗
```

Real-looking tx IDs, explorer links, live console log. CLI fallback if the demo fails.

</td>
</tr>
<tr>
<td width="50%">

### ⚡ Performance Dashboard
**4-tab Recharts dashboard** that makes the "why migrate" case visually:

- 📊 **Cost bars** — ETH vs Polygon vs Solana, 5 operations
- 🏎 **TPS table** — 65,000 vs 15, with finality times
- 🎯 **Radar chart** — 6-dimension ecosystem comparison  
- 📈 **Gas history** — 12-month dual-axis line chart

</td>
<td width="50%">

### 📄 Export Report
One-click full migration package:

- ✅ **Markdown** — paste into Notion, GitHub, Confluence
- 📄 **PDF** — styled cover page, section headers, tables  
  *(jsPDF loaded from CDN on demand — zero bundle cost)*

**Includes a dedicated Sunrise DeFi section** with step-by-step liquidity application instructions.

</td>
</tr>
</table>

---

## ⚡ Quick Start

```bash
# Clone
git clone https://github.com/your-username/sunrise-migration-copilot
cd sunrise-migration-copilot

# Install
npm install

# Dev server
npm run dev
```

> **Requires** Node.js 18+. Open `http://localhost:5173` and drag in any `.sol` file.

### Build for production

```bash
npm run build
npm run preview
```

---

## 🗺 The 10-Step Pipeline

Navigate using the top step bar. State computed in step 1 flows through all 10 steps with no re-parsing.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⬆ Upload → 🔍 Analyze → 🗺 Map → ⚓ Anchor → 🌉 Token Guide               │
│  → 🚀 Live Bridge → 💰 Cost → ⚡ Performance → ✅ Checklist → 📄 Report     │
└──────────────────────────────────────────────────────────────────────────────┘
```

<details>
<summary><strong>Step 1 — Upload Contract</strong></summary>

Drag-and-drop a `.sol` file or paste source directly. `FileUploader` reads the file, triggers the full parse pipeline, and auto-advances to Analysis. Supports single-file contracts and multi-contract files.

</details>

<details>
<summary><strong>Step 2 — Contract Analysis</strong></summary>

`parseSolidity()` runs a layered regex parser and returns a `ParsedContract` object:

```ts
interface ParsedContract {
  contracts:        ContractDef[];   // all contracts in the file
  pragmaVersion:    string;          // e.g. "^0.8.20"
  lineCount:        number;
  complexity:       "low" | "medium" | "high";
  isERC20:          boolean;
  isERC721:         boolean;
  hasOwnable:       boolean;
  hasAccessControl: boolean;
  hasMappings:      boolean;
}
```

No `solc-js` compiler — keeps the bundle under 2 MB.

</details>

<details>
<summary><strong>Step 3 — Mapping Suggestions</strong></summary>

`applyMappingRules()` matches the parsed contract against a typed `MappingRule[]` library. Each rule includes:

- `evmConcept` / `solanaConcept` — what maps to what
- `rationale` — why this mapping makes sense  
- `complexity` — `low` / `medium` / `high`
- `anchor_snippet` — copy-paste Rust code
- `docs_link` — relevant Anchor / Solana documentation

Rules cover: **state**, **token**, **access control**, **events**, **patterns**, and **storage**.

</details>

<details>
<summary><strong>Step 4 — Anchor Skeleton Generator</strong></summary>

`generateAnchorSkeleton()` chains 8 builder functions:

| Function | Output |
|---|---|
| `buildLibRs()` | Main program file with all instruction stubs |
| `buildAccountStructs()` | `#[account]` structs with byte-accurate `space` |
| `buildContextStructs()` | `Context<T>` for each instruction |
| `buildInstructionHandlers()` | One handler stub per public EVM function |
| `buildErrorCodes()` | `#[error_code]` from `require()` messages |
| `buildAnchorToml()` | Cluster + program ID config |
| `buildCargoToml()` | Rust manifest with anchor-lang dependency |
| `buildTests()` | TypeScript/Mocha test scaffolding |

Helper `solidityTypeToRust()` converts EVM types: `uint256` → `u64`, `address` → `Pubkey`, `bytes32` → `[u8; 32]`. `rustTypeSize()` calculates byte usage per field for account space.

</details>

<details>
<summary><strong>Step 5 — Token Migration Guide</strong></summary>

9-step interactive guide powered by `wormholeDemo.ts`:

1. Install `@wormhole-foundation/sdk`
2. Snapshot EVM token holders
3. Deploy SPL mint on Solana
4. Configure Wormhole NTT (Manager + Transceiver on EVM, Hub on Solana)
5. Test full flow on testnet
6. Distribute SPL tokens to snapshot holders
7. Revoke EVM mint authority
8. Execute mainnet migration
9. Apply to Sunrise for day-one liquidity pools

Each step includes shell commands, SDK code snippets, and documentation links.

</details>

<details>
<summary><strong>Step 6 — Live Testnet Bridge Demo ⭐</strong></summary>

The standout feature. Simulates the full Wormhole NTT transfer with:

- **Amount selector** — 1 / 10 / 100 testnet tokens
- **Recipient input** — Solana devnet wallet address
- **5 animated stages** with per-stage timing and live status
- **Fake-but-realistic tx IDs** — seeded hash functions producing valid-length EVM and Base58 Solana hashes
- **Explorer links** — Sepolia Etherscan + Solana Explorer + Wormholescan
- **Auto-scrolling console log** with colour-coded output
- **Sunrise CTA** on completion — day-one liquidity application
- **CLI fallback** if demo errors — pre-filled `npx tsx migrate-token.ts` command

For production wiring: replace the simulation delay in each stage with real `ethers.Wallet` and `Keypair` calls from `wormhole-integration/migrate-token.ts`.

</details>

<details>
<summary><strong>Step 7 — Cost Comparison</strong></summary>

`estimateCosts()` analyses contract complexity to produce a `CostEstimate`:

```ts
interface CostEstimate {
  ethereum:       ChainCost;   // deploymentCost, perTxCost, storagePerSlot, ...
  solana:         ChainCost;
  savingsPercent: number;
  savingsUSD:     number;
  comparison:     CostBreakdownItem[];
  assumptions:    string[];
}
```

Pricing assumptions (2026): ETH at $2,800 · 18 gwei avg · SOL at $160 · 5,000 lamports/tx.

</details>

<details>
<summary><strong>Step 8 — Performance Dashboard ⭐</strong></summary>

Four independent Recharts tabs:

**Cost Compare** — `BarChart` with 3 series (Ethereum / Polygon / Solana) across 5 operations. Solana bars are barely visible — the visual gap is the argument.

**TPS & Speed** — Horizontal `BarChart` + finality table. Bitcoin 7 → Ethereum 15 → Polygon 7K → Arbitrum 4K → Solana 65K.

**Capability Radar** — `RadarChart` with 6 axes: Throughput, Cost, Finality, Dev Tools, Ecosystem, Composability.

**Gas History** — `LineChart` with **dual Y-axes**: left for ETH gas (volatile, dollars), right for Solana fee (flat, fractions of a cent). The dual-axis is intentional — putting both on the same scale would make the Solana line invisible.

</details>

<details>
<summary><strong>Step 9 — Migration Checklist</strong></summary>

Dynamically generated from your contract's characteristics:

- Has `mapping()` → adds PDA seed design tasks (one per mapping)
- `isERC20` → adds SPL Token mint + ATA flow testing
- `isERC721` → adds Metaplex Token Metadata integration
- `hasOwnable` → adds authority constraint implementation
- Skeleton generated → adds per-instruction implementation items
- Always adds: testing, security audit, devnet deploy, NTT config, Sunrise application

16 items total. Priority-labelled (`CRITICAL` / `HIGH` / `MED` / `LOW`). Pre-ticked for steps the tool completed.

</details>

<details>
<summary><strong>Step 10 — Export Report ⭐</strong></summary>

**Markdown export** — `buildMarkdown()` uses `array.push()` with `const fence = "` ` ``` ` `"` stored as a variable. This avoids the TypeScript compiler error from nested backticks inside template literals (triple-backtick code fences inside a template literal close the outer template).

**PDF export** — jsPDF loaded via `new Function("url", "return import(url)")` at click-time. This bypasses TypeScript's static module analysis for CDN URLs. Falls back to `window.print()` if CDN is unreachable.

Report sections: contract analysis table · state variables + functions · mapping rules with Rust snippets · Anchor skeleton inventory · 9-step migration plan · cost table · checklist · resources · **Sunrise DeFi integration guide**.

</details>

---

## 🏗 Architecture

```
src/
├── components/
│   ├── FileUploader.tsx          # drag-drop + paste upload
│   ├── AnalysisDisplay.tsx       # contract structure viewer
│   ├── MappingSuggestions.tsx    # filterable rule cards
│   ├── AnchorSkeleton.tsx        # generated file viewer
│   ├── TokenMigrationGuide.tsx   # 9-step NTT walkthrough
│   ├── LiveBridgeDemo.tsx        # ⭐ animated NTT simulation
│   ├── CostComparison.tsx        # side-by-side USD breakdown
│   ├── PerformanceDashboard.tsx  # ⭐ 4-tab Recharts dashboard
│   ├── MigrationChecklist.tsx    # dynamic priority checklist
│   ├── ChecklistExport.tsx       # checklist with download
│   └── MigrationReport.tsx       # ⭐ MD + PDF export
│
├── utils/
│   ├── solidityParser.ts         # regex-based .sol parser
│   ├── mappingRules.ts           # EVM → Solana rule library
│   ├── anchorGenerator.ts        # Anchor project synthesiser
│   ├── costCalculator.ts         # USD cost estimator
│   └── wormholeDemo.ts           # Wormhole SDK snippets + plan
│
└── App.tsx                       # 10-step state orchestrator
```

### Data flow

```
FileUploader
     │
     ▼
parseSolidity()       →  ParsedContract
applyMappingRules()   →  MappingRule[]
generateAnchorSkeleton() →  AnchorSkeleton
estimateCosts()       →  CostEstimate
     │
     ▼
App.tsx (single source of truth)
     │
     ├── AnalysisDisplay     (parsed)
     ├── MappingSuggestions  (mappings, parsed)
     ├── AnchorSkeleton      (skeleton)
     ├── TokenMigrationGuide (parsed)
     ├── LiveBridgeDemo      (parsed)
     ├── CostComparison      (costs)
     ├── PerformanceDashboard(costs)
     ├── ChecklistExport     (parsed, mappings, skeleton)
     └── MigrationReport     (parsed, mappings, skeleton, costs)
```

No global state library. All computed state lives in `App.tsx` and flows down as props — the data graph doesn't need Redux or Zustand.

---

## 🌉 Wormhole NTT Bridge

The tool is built around Wormhole's **Native Token Transfers (NTT)** protocol — the standard for migrating tokens across chains while maintaining full supply control.

```
  Sepolia (EVM)                    Wormhole                    Solana Devnet
  ┌─────────────┐     lock/burn    ┌──────────┐   mint/unlock  ┌─────────────┐
  │ ERC-20      │ ──────────────▶  │ Guardian │ ─────────────▶ │ SPL Token   │
  │ NTT Manager │    VAA + relay   │   VAA    │                │ NTT Hub     │
  └─────────────┘                  └──────────┘                └──────────┬──┘
                                                                           │
                                                                    ┌──────▼──────┐
                                                                    │  ☀ Sunrise  │
                                                                    │  Liquidity  │
                                                                    │    Pool     │
                                                                    └─────────────┘
```

### Live transfer flow

```ts
// wormhole-integration/migrate-token.ts
const wh = await wormhole("Testnet", [evm, solana]);

const srcChain = wh.getChain("Sepolia");
const dstChain = wh.getChain("Solana");

const xfer = await wh.tokenTransfer(
  "ntt",
  amount.units(amount.parse("100.0", 18)),
  srcChain.address(evmSenderAddress),
  dstChain.address(solanaRecipient),
  false   // set true for automatic relay
);

const [srcTx] = await xfer.initiateTransfer(evmSigner);
const attestation = await xfer.fetchAttestation(60_000);
const [dstTx] = await xfer.completeTransfer(solanaSigner);
```

See the [Wormhole TypeScript SDK docs](https://wormhole.com/docs/tools/typescript-sdk/get-started/) for full NTT setup.

---

## ☀ Sunrise DeFi Integration

Every export and every demo completion screen surfaces the Sunrise integration path:

> *"Post-migration, coordinate with Sunrise for day-one liquidity pools. Sunrise provides the canonical liquidity route for newly bridged assets entering the Solana ecosystem."*

**What Sunrise provides:**

| Feature | Detail |
|---|---|
| 🏊 Day-one liquidity | AMM pools bootstrapped immediately — no cold-start problem |
| 🔀 Smart routing | Best execution via Orca + Raydium through Sunrise |
| 📈 Price discovery | Managed bootstrapping prevents manipulation |
| 🌉 NTT-native | Built for Wormhole-bridged assets |

**Apply:** [sunrisedefi.com](https://www.sunrisedefi.com/) · **Twitter/X:** [@Sunrise_DeFi](https://x.com/Sunrise_DeFi)

---

## 📊 Performance Numbers

| Metric | Ethereum | Solana | Δ |
|---|---|---|---|
| Throughput | 15 TPS | **65,000 TPS** | +433,233% |
| Finality | ~13 min | **~400ms** | 1,950× faster |
| Avg tx cost | ~$2.30 | **~$0.00009** | 99.99% cheaper |
| Deploy cost | ~$150–$300 | **~$0.003** | 99.99% cheaper |
| Monthly (10K txs) | ~$23,000 | **~$0.90** | ~$22,999 saved |

*Based on 2026 averages: ETH $2,800 · 18 gwei · SOL $160 · 5,000 lamports/tx*

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 5 |
| Charts | Recharts |
| PDF | jsPDF (CDN, lazy-loaded on demand) |
| Bridge SDK | @wormhole-foundation/sdk |
| Solana | @solana/spl-token, @solana/web3.js |
| Rust | Anchor Framework |
| Module syntax | `verbatimModuleSyntax` enforced |

**Key engineering decisions:**

- **No solc-js** — custom regex parser keeps bundle under 2 MB
- **No global store** — all state in `App.tsx`, flows via props
- **CDN-lazy PDF** — jsPDF only fetched on click, never in initial load
- **Array-push markdown** — avoids nested backtick template literal TypeScript errors
- **`new Function` dynamic import** — bypasses TS static analysis for CDN URLs

---

## 🧪 Supported Contract Types

| Contract Type | Parser | Mappings | Anchor Gen | Checklist |
|---|---|---|---|---|
| ERC-20 token | ✅ | ✅ SPL-specific | ✅ mint/burn/transfer | ✅ ATA items |
| ERC-721 NFT | ✅ | ✅ Metaplex-specific | ✅ mint-per-NFT | ✅ Metaplex items |
| Ownable / AccessControl | ✅ | ✅ authority patterns | ✅ constraint stubs | ✅ auth items |
| Custom DeFi logic | ✅ | ✅ generic patterns | ✅ function stubs | ✅ base items |
| Multi-contract files | ✅ | ✅ per-contract | ✅ primary contract | ✅ base items |

---

## 🐛 Notable Bugs Fixed

During development, **31 TypeScript errors** were resolved across 8 files. The most interesting:

<details>
<summary><strong>Nested backtick template literal crash (21 errors)</strong></summary>

**Problem:** `buildMarkdown()` used one giant template literal containing triple-backtick code fences. TypeScript's parser saw the inner backtick as closing the outer template literal and produced 21 parse errors.

**Fix:** Rewrote as `array.push()` with `const fence = "` ` ``` ` `"` stored as a string variable. The fence string is concatenated normally — no nested backticks anywhere.

</details>

<details>
<summary><strong>Wrong MappingRule field names</strong></summary>

**Problem:** New components referenced `m.evmPattern`, `m.anchorEquivalent`, `m.priority`, `m.description`, `m.anchorSnippet` — but the actual interface uses `evmConcept`, `solanaConcept`, `complexity`, `rationale`, `anchor_snippet`.

**Fix:** Inspected the real `mappingRules.ts` type definition and corrected all references.

</details>

<details>
<summary><strong>CDN dynamic import type error</strong></summary>

**Problem:** `await import("https://cdn.jsdelivr.net/..." as any)` is not valid TypeScript — the `as any` cast applies to the string, not the import call.

**Fix:** `new Function("url", "return import(url)") as (url: string) => Promise<any>` — creates a runtime dynamic import that TypeScript can't statically analyse.

</details>

<details>
<summary><strong>buildMigrationPlan version mismatch</strong></summary>

**Problem:** Local `wormholeDemo.ts` had a 1-argument version; `TokenMigrationGuide` called the 3-argument version `(tokenName, isERC20, isERC721)`.

**Fix:** Delivered the canonical 3-argument implementation.

</details>

---

## 🗺 Roadmap

- [ ] **Live NTT execution** — wire `ethers.Wallet` + Solana `Keypair` in `migrate-token.ts`
- [ ] **Multi-file upload** — handle contracts spread across multiple `.sol` files
- [ ] **Foundry test generation** — export Forge tests alongside Anchor tests
- [ ] **Sunrise SDK integration** — direct liquidity pool application from the UI
- [ ] **AI-assisted mapping review** — flag ambiguous mappings for human review
- [ ] **Mainnet cost oracle** — pull live gas prices via Etherscan API

---

## 🤝 Contributing

```bash
git clone https://github.com/your-username/sunrise-migration-copilot
cd sunrise-migration-copilot
npm install
npm run dev
```

PRs welcome. Focus areas:
- **Parser accuracy** — edge cases in `solidityParser.ts`
- **New mapping rules** — add to `mappingRules.ts`
- **Anchor generation** — improve stub quality in `anchorGenerator.ts`
- **UI/UX** — the dark theme lives in `index.css`

---

## 📜 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

**Built with ☀ for the [Solana Graveyard Hackathon](https://solana.com/graveyard-hack)**

[sunrisedefi.com](https://www.sunrisedefi.com) · [@Sunrise_DeFi](https://x.com/Sunrise_DeFi) · [Wormhole SDK](https://wormhole.com/docs/tools/typescript-sdk/get-started/) · [Anchor Docs](https://www.anchor-lang.com)

<br/>

*If this helped you migrate, star the repo and apply to [Sunrise](https://www.sunrisedefi.com) for day-one liquidity* ⭐

</div>
