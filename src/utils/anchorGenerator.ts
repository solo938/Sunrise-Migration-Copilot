// anchorGenerator.ts
// Generates Anchor skeleton files from a ParsedContract

import type { ParsedContract, ContractDef, FunctionDef } from "./solidityParser";

export interface AnchorFile {
  filename: string;
  language: "rust" | "toml" | "typescript";
  content: string;
}

export interface AnchorSkeleton {
  programName: string;
  files: AnchorFile[];
  instructions: string[];
  accountStructs: string[];
  warnings: string[];
}

// ── Public API ─────────────────────────────────────────────────────────
export function generateAnchorSkeleton(parsed: ParsedContract): AnchorSkeleton {
  const mainContract = parsed.contracts.find((c) => c.kind === "contract") ?? parsed.contracts[0];
  if (!mainContract) {
    return { programName: "migration_example", files: [], instructions: [], accountStructs: [], warnings: ["No contract found."] };
  }

  const programName = toSnakeCase(mainContract.name);
  const warnings: string[] = [];

  if (parsed.isERC20) warnings.push("ERC-20 detected — consider using SPL Token instead of reimplementing.");
  if (parsed.isERC721) warnings.push("ERC-721 detected — consider Metaplex Token Metadata program.");
  if (parsed.complexity === "high") warnings.push("High complexity contract — manual review of account sizing required.");

  const libRs = buildLibRs(mainContract, parsed, programName);
  const anchorToml = buildAnchorToml(programName);
  const tests = buildTests(mainContract, programName);
  const cargoToml = buildCargoToml(programName);

  const instructions = mainContract.functions
    .filter((f) => !f.isConstructor && (f.visibility === "public" || f.visibility === "external"))
    .map((f) => toSnakeCase(f.name));

  const accountStructs = buildAccountStructNames(mainContract);

  return {
    programName,
    instructions,
    accountStructs,
    warnings,
    files: [
      { filename: `programs/${programName}/src/lib.rs`, language: "rust", content: libRs },
      { filename: "Anchor.toml", language: "toml", content: anchorToml },
      { filename: `programs/${programName}/Cargo.toml`, language: "toml", content: cargoToml },
      { filename: `tests/${programName}.ts`, language: "typescript", content: tests },
    ],
  };
}

// ── lib.rs ─────────────────────────────────────────────────────────────
function buildLibRs(contract: ContractDef, parsed: ParsedContract, programName: string): string {
  const programId = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"; // placeholder
  const publicFns = contract.functions.filter(
    (f) => !f.isConstructor && (f.visibility === "public" || f.visibility === "external")
  );

  const accountStructs = buildAccountStructs(contract, parsed);
  const contextStructs = buildContextStructs(contract, publicFns);
  const instructionHandlers = buildInstructionHandlers(publicFns, contract.name);
  const errorCodes = buildErrorCodes(contract, parsed);

  return `use anchor_lang::prelude::*;
${parsed.isERC20 ? "use anchor_spl::token::{self, Token, TokenAccount, Mint};\nuse anchor_spl::associated_token::AssociatedToken;" : ""}

declare_id!("${programId}");

// ── Program ────────────────────────────────────────────────────────────
#[program]
pub mod ${programName} {
    use super::*;

${instructionHandlers}
}

// ── Account Structs ────────────────────────────────────────────────────
${accountStructs}

// ── Context Structs ────────────────────────────────────────────────────
${contextStructs}

// ── Errors ────────────────────────────────────────────────────────────
${errorCodes}
`;
}

function buildAccountStructs(contract: ContractDef, parsed: ParsedContract): string {
  const vars = contract.stateVariables.filter((v) => !v.typeName.startsWith("mapping"));

  const fields = vars
    .map((v) => `    pub ${toSnakeCase(v.name)}: ${solidityTypeToRust(v.typeName)},`)
    .join("\n");

  const mainStruct = `#[account]
#[derive(Default)]
pub struct ${contract.name}State {
    pub authority: Pubkey,
    pub bump: u8,
${fields}
}

impl ${contract.name}State {
    pub const LEN: usize = 8    // discriminator
        + 32                    // authority
        + 1                     // bump
${vars.map((v) => `        + ${rustTypeSize(solidityTypeToRust(v.typeName))}  // ${v.name}`).join("\n")};
}`;

  // Mapping PDA structs
  const mappingVars = contract.stateVariables.filter((v) => v.typeName.startsWith("mapping"));
  const mappingStructs = mappingVars
    .map(
      (v) => `
#[account]
pub struct ${capitalize(toSnakeCase(v.name))}Entry {
    pub key: Pubkey,
    pub value: u64,
    pub bump: u8,
}`
    )
    .join("\n");

  // ERC20 extra
  let tokenStruct = "";
  if (parsed.isERC20) {
    tokenStruct = `
// SPL Token accounts are managed by the Token program — no custom struct needed.
// Use Mint and TokenAccount from anchor_spl::token.`;
  }

  return mainStruct + mappingStructs + tokenStruct;
}

function buildContextStructs(contract: ContractDef, fns: FunctionDef[]): string {
  const initCtx = `#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = ${contract.name}State::LEN,
        seeds = [b"${toSnakeCase(contract.name)}", authority.key().as_ref()],
        bump
    )]
    pub state: Account<'info, ${contract.name}State>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}`;

  const fnCtxs = fns
    .filter((f) => f.name !== "constructor")
    .slice(0, 4) // limit for brevity
    .map(
      (f) => `
#[derive(Accounts)]
pub struct ${capitalize(f.name)}<'info> {
    #[account(
        mut,
        seeds = [b"${toSnakeCase(contract.name)}", authority.key().as_ref()],
        bump = state.bump,
        constraint = authority.key() == state.authority @ ErrorCode::Unauthorized
    )]
    pub state: Account<'info, ${contract.name}State>,

    pub authority: Signer<'info>,
}`
    )
    .join("\n");

  return initCtx + fnCtxs;
}

function buildInstructionHandlers(fns: FunctionDef[], contractName: string): string {
  const ctorHandler = `    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.bump = bump;
        msg!("${contractName} initialized");
        Ok(())
    }`;

  const fnHandlers = fns
    .filter((f) => !f.isConstructor)
    .slice(0, 8)
    .map((f) => {
      const paramList = f.parameters
        .map((p) => `_${toSnakeCase(p.name || "param")}: ${solidityTypeToRust(p.typeName)}`)
        .join(", ");
      return `
    /// Migrated from Solidity: ${f.name}(${f.parameters.map((p) => p.typeName).join(", ")})
    pub fn ${toSnakeCase(f.name)}(ctx: Context<${capitalize(f.name)}>${paramList ? `, ${paramList}` : ""}) -> Result<()> {
        let _state = &mut ctx.accounts.state;
        // TODO: implement ${f.name} logic
        Ok(())
    }`;
    })
    .join("\n");

  return ctorHandler + fnHandlers;
}

function buildErrorCodes(_contract: ContractDef, parsed: ParsedContract): string {
  const errors = [
    { name: "Unauthorized", msg: "Signer is not authorized" },
    { name: "InvalidAmount", msg: "Amount must be greater than zero" },
    { name: "InsufficientFunds", msg: "Insufficient balance" },
    ...(parsed.isERC20 ? [{ name: "TransferFailed", msg: "Token transfer failed" }] : []),
    ...(parsed.hasAccessControl ? [{ name: "MissingRole", msg: "Caller does not have required role" }] : []),
  ];

  return `#[error_code]
pub enum ErrorCode {
${errors.map((e, i) => `    #[msg("${e.msg}")]\n    ${e.name} = ${6000 + i},`).join("\n")}
}`;
}

// ── Anchor.toml ────────────────────────────────────────────────────────
function buildAnchorToml(programName: string): string {
  return `[features]
seeds = false
skip-lint = false

[programs.localnet]
${programName} = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
`;
}

// ── Cargo.toml ─────────────────────────────────────────────────────────
function buildCargoToml(programName: string): string {
  return `[package]
name = "${programName}"
version = "0.1.0"
description = "Migrated from EVM — generated by Sunrise Migration Copilot"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "${programName}"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = { version = "0.30.0", features = ["init-if-needed"] }
anchor-spl = { version = "0.30.0", features = ["token", "associated_token"] }
`;
}

// ── Tests ──────────────────────────────────────────────────────────────
function buildTests(contract: ContractDef, programName: string): string {
  const publicFns = contract.functions.filter(
    (f) => !f.isConstructor && (f.visibility === "public" || f.visibility === "external")
  );

  return `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ${capitalize(programName)} } from "../target/types/${programName}";
import { expect } from "chai";

describe("${programName}", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.${capitalize(programName)} as Program<${capitalize(programName)}>;
  const authority = provider.wallet;

  let statePda: anchor.web3.PublicKey;
  let stateBump: number;

  before(async () => {
    [statePda, stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("${toSnakeCase(contract.name)}"), authority.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Initializes the program state", async () => {
    const tx = await program.methods
      .initialize(stateBump)
      .accounts({
        state: statePda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize tx:", tx);

    const state = await program.account.${toSnakeCase(contract.name)}State.fetch(statePda);
    expect(state.authority.toString()).to.equal(authority.publicKey.toString());
  });

${publicFns
  .slice(0, 3)
  .map(
    (f) => `  it("Calls ${toSnakeCase(f.name)}", async () => {
    // TODO: implement test for ${f.name}
    const tx = await program.methods
      .${toSnakeCase(f.name)}()
      .accounts({
        state: statePda,
        authority: authority.publicKey,
      })
      .rpc();
    console.log("${f.name} tx:", tx);
  });`
  )
  .join("\n\n")}
});
`;
}

// ── helpers ────────────────────────────────────────────────────────────
function solidityTypeToRust(t: string): string {
  const map: Record<string, string> = {
    address: "Pubkey",
    bool: "bool",
    string: "String",
    uint256: "u64",
    uint128: "u64",
    uint64: "u64",
    uint32: "u32",
    uint16: "u16",
    uint8: "u8",
    int256: "i64",
    int128: "i64",
    int64: "i64",
    int32: "i32",
    bytes32: "[u8; 32]",
    bytes: "Vec<u8>",
  };
  return map[t] ?? "Vec<u8>";
}

function rustTypeSize(t: string): string {
  const sizes: Record<string, string> = {
    Pubkey: "32",
    bool: "1",
    u64: "8",
    u32: "4",
    u16: "2",
    u8: "1",
    i64: "8",
    "Vec<u8>": "4 + 256", // dynamic, estimate
    String: "4 + 200",
    "[u8; 32]": "32",
  };
  return sizes[t] ?? "32";
}

function toSnakeCase(s: string): string {
  return s
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildAccountStructNames(contract: ContractDef): string[] {
  return [
    `${contract.name}State`,
    ...contract.stateVariables
      .filter((v) => v.typeName.startsWith("mapping"))
      .map((v) => `${capitalize(toSnakeCase(v.name))}Entry`),
  ];
}