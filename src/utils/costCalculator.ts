import type { ParsedContract } from "./solidityParser";

export interface ChainCost {
    chain: "Ethereum" | "Solana";
    deploymentGas?: number;
    deploymentCost: number;
    deploymentNative: string;
    perTxCost: number;
    perTxNative: string;
    storagePerSlot: number;
    annualMaintenanceUSD: number;
    details: CostBreakdownItem[];
}

export interface CostBreakdownItem {
    label: string;
    ethValue?: string;
    solValue?: string;
    ethUSD?: number;
    solUSD?: number;
  }
  
  export interface CostEstimate {
    ethereum: ChainCost;
    solana: ChainCost;
    savingsPercent: number;
    savingsUSD: number;
    comparison: CostBreakdownItem[];
    assumptions: string[];
  }

  
const ETH_PRICE_USD = 2800;
const SOL_PRICE_USD = 160;
const ETH_GAS_GWEI = 18;           // avg mainnet gwei
const SOL_CU_PRICE = 0.000001;     // SOL per compute unit (default priority)
const SOL_LAMPORTS_PER_SOL = 1e9;
const SOL_RENT_EXEMPT_PER_BYTE = 6960; // lamports / byte


export function estimateCosts(source: string, parsed: ParsedContract): CostEstimate {
    const lines = source.split("\n").length;
    const fnCount = parsed.contracts.reduce((sum, c) => sum + c.functions.length, 0);
    const stateVarCount = parsed.contracts.reduce((sum, c) => sum + c.stateVariables.length, 0);

    const mappingCount = parsed.contracts
        .flatMap(c => c.stateVariables)
        .filter(v => v.typeName.startsWith("mapping")).length;



        const estimatedBytecode = Math.min(lines * 200, 24576); // 24KB limit
  const deployGas = 21000 + estimatedBytecode * 200 + fnCount * 15000 + stateVarCount * 5000;
  const deployETH = (deployGas * ETH_GAS_GWEI * 1e-9);
  const deployETHusd = deployETH * ETH_PRICE_USD;

  const perTxGas = 21000 + 30000 + fnCount * 2000;
  const perTxETH = perTxGas * ETH_GAS_GWEI * 1e-9;
  const perTxETHusd = perTxETH * ETH_PRICE_USD;

  const storagePerSlotETH = 20000 * ETH_GAS_GWEI * 1e-9; // SSTORE: 20k gas
  const storagePerSlotUSD = storagePerSlotETH * ETH_PRICE_USD;
  const annualEth = perTxETHusd * 1000 + storagePerSlotUSD * stateVarCount * 5;

  // ── Solana ──────────────────────────────────────────────────────────
  // Program deployment: ~1 SOL per 50KB (rent for program account)
  const programBytes = Math.min(estimatedBytecode * 1.5, 200 * 1024); // conservative
  const rentLamports = programBytes * SOL_RENT_EXEMPT_PER_BYTE;
  const deploySol = rentLamports / SOL_LAMPORTS_PER_SOL + 0.01; // + sig fee
  const deploySOLusd = deploySol * SOL_PRICE_USD;

  // Per-tx: signature fee (5000 lamports) + compute units
  const perTxSigFee = 5000 / SOL_LAMPORTS_PER_SOL;
  const perTxCU = fnCount * 5000;
  const perTxPriorityFee = perTxCU * SOL_CU_PRICE / SOL_LAMPORTS_PER_SOL;
  const perTxSol = perTxSigFee + perTxPriorityFee;
  const perTxSOLusd = perTxSol * SOL_PRICE_USD;

  // Account rent: per account ~50-200 bytes
  const accountBytes = stateVarCount * 32 + 64; // rough
  const accountRent = (accountBytes * SOL_RENT_EXEMPT_PER_BYTE) / SOL_LAMPORTS_PER_SOL;
  const storagePerAccUSD = accountRent * SOL_PRICE_USD;
  const annualSol = perTxSOLusd * 1000 + storagePerAccUSD * 2;

  // ── PDA accounts for mappings (extra cost) ──────────────────────────
  const pdaCost = mappingCount * accountRent * SOL_PRICE_USD;

  const ethereum: ChainCost = {
    chain: "Ethereum",
    deploymentGas: deployGas,
    deploymentCost: round(deployETHusd),
    deploymentNative: `${deployETH.toFixed(4)} ETH`,
    perTxCost: round(perTxETHusd),
    perTxNative: `${(perTxGas * ETH_GAS_GWEI * 1e-9).toFixed(5)} ETH`,
    storagePerSlot: round(storagePerSlotUSD),
    annualMaintenanceUSD: round(annualEth),
    details: [
      { label: "Estimated bytecode size", ethValue: `~${Math.round(estimatedBytecode / 1024)} KB` },
      { label: "Estimated deploy gas", ethValue: deployGas.toLocaleString() },
      { label: "Gas price assumption", ethValue: `${ETH_GAS_GWEI} gwei` },
      { label: "ETH price assumption", ethValue: `$${ETH_PRICE_USD}` },
      { label: "SSTORE cost (1 slot)", ethValue: "20,000 gas" },
      { label: "Per-tx gas (avg)", ethValue: perTxGas.toLocaleString() },
    ],
  };

  const solana: ChainCost = {
    chain: "Solana",
    deploymentCost: round(deploySOLusd),
    deploymentNative: `${deploySol.toFixed(4)} SOL`,
    perTxCost: round(perTxSOLusd * 100) / 100,
    perTxNative: `~${Math.round(perTxSol * SOL_LAMPORTS_PER_SOL).toLocaleString()} lamports`,
    storagePerSlot: round(storagePerAccUSD),
    annualMaintenanceUSD: round(annualSol + pdaCost),
    details: [
      { label: "Program binary size", solValue: `~${Math.round(programBytes / 1024)} KB` },
      { label: "Rent-exempt deposit", solValue: `${deploySol.toFixed(4)} SOL (refundable)` },
      { label: "Base signature fee", solValue: "5,000 lamports (~$0.0008)" },
      { label: "SOL price assumption", solValue: `$${SOL_PRICE_USD}` },
      { label: "PDA accounts for mappings", solValue: `${mappingCount} × ~${accountBytes}B` },
      { label: "Compute budget (estimated)", solValue: `${perTxCU.toLocaleString()} CUs/tx` },
    ],
  };

  const savingsUSD = round(deployETHusd - deploySOLusd);
  const savingsPercent = Math.round((savingsUSD / deployETHusd) * 100);

  const comparison: CostBreakdownItem[] = [
    {
      label: "Deployment",
      ethValue: ethereum.deploymentNative,
      ethUSD: ethereum.deploymentCost,
      solValue: solana.deploymentNative,
      solUSD: solana.deploymentCost,
    },
    {
      label: "Per Transaction",
      ethValue: `${perTxGas.toLocaleString()} gas`,
      ethUSD: ethereum.perTxCost,
      solValue: `~${Math.round(perTxSol * SOL_LAMPORTS_PER_SOL).toLocaleString()} lamports`,
      solUSD: solana.perTxCost,
    },
    {
      label: "Storage (1 entry)",
      ethValue: "20,000 gas (permanent)",
      ethUSD: ethereum.storagePerSlot,
      solValue: `~${accountBytes}B rent`,
      solUSD: round(storagePerAccUSD),
    },
    {
      label: "Est. Annual (1k txs)",
      ethUSD: ethereum.annualMaintenanceUSD,
      solUSD: solana.annualMaintenanceUSD,
    },
  ];

  return {
    ethereum,
    solana,
    savingsPercent,
    savingsUSD,
    comparison,
    assumptions: [
      `ETH price: $${ETH_PRICE_USD}`,
      `SOL price: $${SOL_PRICE_USD}`,
      `Gas price: ${ETH_GAS_GWEI} gwei (Ethereum)`,
      "Solana base fee: 5,000 lamports per signature",
      `Rent exemption: ${SOL_RENT_EXEMPT_PER_BYTE.toLocaleString()} lamports/byte`,
      "Solana rent is refundable when accounts are closed",
      "Estimates based on static analysis — actual costs depend on implementation",
    ],
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;













}


