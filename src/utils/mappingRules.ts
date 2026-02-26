
import type { ParsedContract } from "./solidityParser";

export type MappingCategory =
  | "state"
  | "token"
  | "access"
  | "event"
  | "pattern"
  | "storage";

export interface MappingRule {
  id: string;
  category: MappingCategory;
  // EVM side
  evmConcept: string;
  evmDetail: string;
  evmType?: string;
  // Solana side
  solanaConcept: string;
  solanaDetail: string;
  solanaType?: string;
  // Metadata
  rationale: string;
  complexity: "low" | "medium" | "high";
  anchor_snippet?: string;
  docs_link?: string;
}

// ── Type helpers ────────────────────────────────────────────────────────
export function solidityTypeToRust(t: string): string {
  const map: Record<string, string> = {
    address:  "Pubkey",
    bool:     "bool",
    string:   "String",
    uint256:  "u64",
    uint128:  "u64",
    uint64:   "u64",
    uint32:   "u32",
    uint16:   "u16",
    uint8:    "u8",
    int256:   "i64",
    int128:   "i64",
    int64:    "i64",
    int32:    "i32",
    bytes32:  "[u8; 32]",
    bytes:    "Vec<u8>",
  };
  return map[t] ?? "Vec<u8>";
}

export function rustTypeSize(t: string): string {
  const sizes: Record<string, string> = {
    Pubkey:    "32",
    bool:      "1",
    u64:       "8",
    u32:       "4",
    u16:       "2",
    u8:        "1",
    i64:       "8",
    "Vec<u8>": "4 + N",
    String:    "4 + N",
    "[u8; 32]": "32",
  };
  return sizes[t] ?? "?";
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function toSnakeCase(s: string) {
  return s
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

// ── Core rule definitions (static catalogue) ───────────────────────────
export const STATIC_RULES: Omit<MappingRule, "id">[] = [
  // Storage / Contract
  {
    category: "state",
    evmConcept: "contract storage",
    evmDetail: "Persistent key-value storage slots on the EVM",
    evmType: "storage",
    solanaConcept: "#[account] struct",
    solanaDetail: "Borsh-serialized struct inside a Program-owned account",
    solanaType: "Account<'info, T>",
    rationale:
      "The EVM gives each contract its own implicit key-value store. Solana has no implicit storage — all state lives in discrete accounts owned by the program.",
    complexity: "medium",
    anchor_snippet:
      "#[account]\n#[derive(Default)]\npub struct ProgramState {\n    pub authority: Pubkey,  // 32\n    pub bump: u8,           //  1\n    // add your fields here\n}",
    docs_link: "https://www.anchor-lang.com/docs/account-types",
  },

  // mapping(K => V)
  {
    category: "storage",
    evmConcept: "mapping(K => V)",
    evmDetail: "Solidity hash-map — O(1) key lookup, unbounded entries",
    evmType: "mapping",
    solanaConcept: "PDA per key",
    solanaDetail: "One account per entry, seeded by [b\"prefix\", key.as_ref()]",
    solanaType: "Account<'info, EntryData>",
    rationale:
      "Solana has no on-chain hash-map. Each mapping entry becomes its own PDA account. This enables parallel access and on-chain enumeration via indexers, but requires knowing the key upfront.",
    complexity: "high",
    anchor_snippet:
      "// In Context struct:\n#[account(\n    init_if_needed,\n    payer = payer,\n    space = 8 + EntryData::LEN,\n    seeds = [b\"entry\", key.as_ref()],\n    bump\n)]\npub entry: Account<'info, EntryData>,\n\n#[account]\npub struct EntryData {\n    pub key: Pubkey,\n    pub value: u64,\n    pub bump: u8,\n}",
    docs_link: "https://www.anchor-lang.com/docs/pdas",
  },

  // address owner / Ownable
  {
    category: "access",
    evmConcept: "address owner (Ownable)",
    evmDetail: "OpenZeppelin Ownable — msg.sender == owner check",
    evmType: "address",
    solanaConcept: "authority: Pubkey + Signer constraint",
    solanaDetail: "Store authority in state; validate with has_one or constraint",
    solanaType: "Signer<'info>",
    rationale:
      "There is no msg.sender on Solana. Signer identity must be validated explicitly in the account Context struct.",
    complexity: "low",
    anchor_snippet:
      "#[account(\n    mut,\n    has_one = authority @ ErrorCode::Unauthorized\n)]\npub state: Account<'info, ProgramState>,\npub authority: Signer<'info>,",
    docs_link: "https://www.anchor-lang.com/docs/account-constraints",
  },

  // AccessControl roles
  {
    category: "access",
    evmConcept: "AccessControl (roles)",
    evmDetail: "bytes32 roles, hasRole / grantRole / revokeRole",
    evmType: "mapping(bytes32 => mapping(address => bool))",
    solanaConcept: "RoleGrant PDA per (role, user)",
    solanaDetail: "PDA existence = granted; closing the account = revoke",
    solanaType: "Account<'info, RoleGrant>",
    rationale:
      "Role membership is account-based on Solana. A PDA seeded by [role_id, user_pubkey] that exists = granted. Deterministic address makes checking cheap.",
    complexity: "high",
    anchor_snippet:
      "#[account]\npub struct RoleGrant {\n    pub role:       [u8; 32],\n    pub grantee:    Pubkey,\n    pub granted_by: Pubkey,\n    pub bump:       u8,\n}\n\nimpl RoleGrant {\n    pub const LEN: usize = 8 + 32 + 32 + 32 + 1;\n}",
  },

  // ERC-20
  {
    category: "token",
    evmConcept: "ERC-20 token",
    evmDetail: "transfer / approve / transferFrom / balanceOf",
    solanaConcept: "SPL Token program",
    solanaDetail: "Shared token program; each holder has an Associated Token Account (ATA)",
    rationale:
      "You do not rewrite token logic. The SPL Token program (or Token-2022 for extensions) is a shared on-chain program. Holders interact via ATAs — no custom program needed for basic fungible tokens.",
    complexity: "low",
    anchor_snippet:
      "use anchor_spl::token::{self, Token, TokenAccount, Mint};\nuse anchor_spl::associated_token::AssociatedToken;\n\n// In context struct:\npub mint: Account<'info, Mint>,\n#[account(\n    associated_token::mint = mint,\n    associated_token::authority = user,\n)]\npub user_ata: Account<'info, TokenAccount>,",
    docs_link: "https://spl.solana.com/token",
  },

  // ERC-721 NFT
  {
    category: "token",
    evmConcept: "ERC-721 NFT",
    evmDetail: "ownerOf / safeTransferFrom / tokenURI",
    solanaConcept: "SPL Token (supply=1) + Metaplex",
    solanaDetail: "NFT = mint with supply 1, decimals 0; metadata via mpl-token-metadata",
    rationale:
      "Solana NFTs are standardized via Metaplex. tokenURI maps to the metadata URI field. Use Metaplex SDK for minting and updates.",
    complexity: "medium",
    docs_link: "https://developers.metaplex.com/token-metadata",
  },

  // Events
  {
    category: "event",
    evmConcept: "Solidity event / emit",
    evmDetail: "Bloom-filter indexed logs in the block",
    solanaConcept: "Anchor #[event] + emit!()",
    solanaDetail: "Emitted via sol_log_data; parsed by Anchor client addEventListener",
    rationale:
      "Solana has no native log indexing like Ethereum. Anchor events use base64-encoded CPI logs that clients subscribe to. Off-chain indexers (Helius, Shyft) can index these.",
    complexity: "low",
    anchor_snippet:
      "#[event]\npub struct MyEvent {\n    pub user:   Pubkey,\n    pub amount: u64,\n}\n\n// In instruction:\nemit!(MyEvent { user: ctx.accounts.user.key(), amount });",
  },

  // Constructor
  {
    category: "pattern",
    evmConcept: "constructor()",
    evmDetail: "Runs once at deployment; sets initial state",
    solanaConcept: "initialize instruction",
    solanaDetail: "An init instruction that creates the state PDA on first call",
    rationale:
      "Solana programs have no constructors. An initialize instruction protected by an is_initialized flag serves the same purpose.",
    complexity: "low",
    anchor_snippet:
      "pub fn initialize(ctx: Context<Initialize>, bump: u8) -> Result<()> {\n    let s = &mut ctx.accounts.state;\n    require!(!s.is_initialized, ErrorCode::AlreadyInitialized);\n    s.authority = ctx.accounts.authority.key();\n    s.bump = bump;\n    s.is_initialized = true;\n    Ok(())\n}",
  },

  // require()
  {
    category: "pattern",
    evmConcept: "require(condition, \"msg\")",
    evmDetail: "Reverts transaction with error string on false",
    solanaConcept: "require!(condition, ErrorCode::Variant)",
    solanaDetail: "#[error_code] enum + require! macro",
    rationale:
      "Anchor's require! macro maps directly to require(). Error codes are strongly typed enums — no stringly-typed messages at runtime.",
    complexity: "low",
    anchor_snippet:
      "#[error_code]\npub enum ErrorCode {\n    #[msg(\"Unauthorized\")]\n    Unauthorized = 6000,\n    #[msg(\"Amount must be > 0\")]\n    InvalidAmount = 6001,\n}\n\n// Usage:\nrequire!(amount > 0, ErrorCode::InvalidAmount);",
  },

  // block.timestamp
  {
    category: "pattern",
    evmConcept: "block.timestamp",
    evmDetail: "Unix timestamp of current block",
    solanaConcept: "Clock::get()?.unix_timestamp",
    solanaDetail: "Must request Clock sysvar — pass as account or via Clock::get()",
    rationale:
      "Solana's wall-clock time is available via the Clock sysvar. Note: Solana slot time varies (~400ms) and is not as precise as Ethereum block time.",
    complexity: "low",
    anchor_snippet:
      "let clock = Clock::get()?;\nlet now = clock.unix_timestamp; // i64 Unix seconds\nrequire!(now >= state.unlock_at, ErrorCode::TooEarly);",
  },

  // ReentrancyGuard
  {
    category: "pattern",
    evmConcept: "ReentrancyGuard / nonReentrant",
    evmDetail: "Prevents re-entrant calls within same transaction",
    solanaConcept: "Largely not needed — Solana runtime prevents most reentrancy",
    solanaDetail: "Cross-program invocations (CPIs) are validated at the runtime level",
    rationale:
      "Solana's account model and runtime design prevent most classic reentrancy attacks. However, carefully audit CPI flows and avoid re-using writable accounts across CPIs.",
    complexity: "low",
  },

  // msg.value / payable
  {
    category: "pattern",
    evmConcept: "payable / msg.value",
    evmDetail: "ETH sent with the transaction",
    solanaConcept: "SOL transfer via SystemProgram::transfer",
    solanaDetail: "Debit payer account explicitly; no implicit value attachment",
    rationale:
      "SOL transfers are explicit on Solana. Use SystemProgram::transfer in a CPI to move lamports between accounts.",
    complexity: "medium",
    anchor_snippet:
      "anchor_lang::system_program::transfer(\n    CpiContext::new(\n        ctx.accounts.system_program.to_account_info(),\n        anchor_lang::system_program::Transfer {\n            from: ctx.accounts.payer.to_account_info(),\n            to:   ctx.accounts.vault.to_account_info(),\n        },\n    ),\n    amount_lamports,\n)?;",
  },
];

// ── Dynamic rule generator ─────────────────────────────────────────────
export function applyMappingRules(parsed: ParsedContract): MappingRule[] {
  let counter = 0;
  const nextId = () => `rule-${++counter}`;
  const rules: MappingRule[] = [];

  const mainContract = parsed.contracts.find((c) => c.kind === "contract") ?? parsed.contracts[0];

  // 1. Contract → program state
  if (mainContract) {
    rules.push({
      id: nextId(),
      ...STATIC_RULES.find((r) => r.evmConcept === "contract storage")!,
      evmConcept: `contract ${mainContract.name} storage`,
      anchor_snippet:
        `#[account]\n#[derive(Default)]\npub struct ${mainContract.name}State {\n    pub authority: Pubkey,\n    pub bump: u8,\n    pub is_initialized: bool,\n    // migrated fields below\n}`,
    });

    // 2. State variables
    for (const v of mainContract.stateVariables) {
      if (v.typeName.startsWith("mapping")) {
        const mappingRule = STATIC_RULES.find((r) => r.evmConcept === "mapping(K => V)")!;
        rules.push({
          id: nextId(),
          ...mappingRule,
          evmConcept: `mapping: ${v.name}`,
          evmDetail: `${v.typeName}`,
          anchor_snippet:
            `// PDA for ${v.name} entry\n#[account(\n    init_if_needed,\n    payer = payer,\n    space = 8 + ${capitalize(toSnakeCase(v.name))}Entry::LEN,\n    seeds = [b"${v.name}", key.as_ref()],\n    bump\n)]\npub ${toSnakeCase(v.name)}_entry: Account<'info, ${capitalize(toSnakeCase(v.name))}Entry>,\n\n#[account]\npub struct ${capitalize(toSnakeCase(v.name))}Entry {\n    pub key: Pubkey,\n    pub value: ${solidityTypeToRust(v.typeName.match(/=>\s*(\w+)/)?.[1] ?? "uint256")},\n    pub bump: u8,\n}`,
        });
      } else if (v.name.toLowerCase().includes("owner") && v.typeName === "address") {
        rules.push({
          id: nextId(),
          ...STATIC_RULES.find((r) => r.evmConcept === "address owner (Ownable)")!,
          evmDetail: `address ${v.name} — owner/admin`,
        });
      } else {
        rules.push({
          id: nextId(),
          category: "state",
          evmConcept: `${v.typeName} ${v.name}`,
          evmDetail: `State variable (${v.visibility})`,
          solanaConcept: "Account field",
          solanaDetail: `pub ${toSnakeCase(v.name)}: ${solidityTypeToRust(v.typeName)},`,
          rationale:
            "Primitive and fixed-size Solidity types map directly to Borsh-serialized fields in a Solana account struct.",
          complexity: "low",
          anchor_snippet:
            `// Inside your #[account] struct:\npub ${toSnakeCase(v.name)}: ${solidityTypeToRust(v.typeName)}, // ${v.typeName}`,
        });
      }
    }

    // 3. Public functions → instructions
    const publicFns = mainContract.functions.filter(
      (f) => !f.isConstructor && (f.visibility === "public" || f.visibility === "external")
    );
    if (publicFns.length > 0) {
      rules.push({
        id: nextId(),
        ...STATIC_RULES.find((r) => r.evmConcept === "constructor()")!,
        evmConcept: `${publicFns.length} public/external functions`,
        evmDetail: publicFns.map((f) => f.name).join(", "),
        solanaConcept: "Anchor instructions",
        solanaDetail: "Each public function = one #[instruction] handler in lib.rs",
        anchor_snippet: publicFns
          .slice(0, 3)
          .map(
            (f) =>
              `pub fn ${toSnakeCase(f.name)}(ctx: Context<${capitalize(f.name)}>) -> Result<()> {\n    // TODO: migrate ${f.name} logic\n    Ok(())\n}`
          )
          .join("\n\n"),
      });
    }

    // 4. Events
    if (mainContract.events.length > 0) {
      const eventRule = STATIC_RULES.find((r) => r.category === "event")!;
      rules.push({
        id: nextId(),
        ...eventRule,
        evmConcept: `${mainContract.events.length} events`,
        evmDetail: mainContract.events.map((e) => e.name).join(", "),
        anchor_snippet: mainContract.events
          .slice(0, 2)
          .map(
            (e) =>
              `#[event]\npub struct ${e.name} {\n${e.parameters
                .map(
                  (p) =>
                    `    pub ${p.name || "value"}: ${solidityTypeToRust(p.typeName)},`
                )
                .join("\n")}\n}`
          )
          .join("\n\n"),
      });
    }
  }

  // 5. Token standards
  if (parsed.isERC20) {
    rules.push({ id: nextId(), ...STATIC_RULES.find((r) => r.evmConcept === "ERC-20 token")! });
  }
  if (parsed.isERC721) {
    rules.push({ id: nextId(), ...STATIC_RULES.find((r) => r.evmConcept === "ERC-721 NFT")! });
  }

  // 6. Access control
  if (parsed.hasOwnable && !rules.some((r) => r.evmConcept.includes("owner"))) {
    rules.push({
      id: nextId(),
      ...STATIC_RULES.find((r) => r.evmConcept === "address owner (Ownable)")!,
    });
  }
  if (parsed.hasAccessControl) {
    rules.push({
      id: nextId(),
      ...STATIC_RULES.find((r) => r.evmConcept === "AccessControl (roles)")!,
    });
  }

  // 7. Common patterns (always add)
  for (const rule of STATIC_RULES.filter(
    (r) => r.category === "pattern" && !rules.some((x) => x.evmConcept === r.evmConcept)
  )) {
    rules.push({ id: nextId(), ...rule });
  }

  return rules;
}

// Re-export for backwards compatibility with components that import MappingSuggestion
export type MappingSuggestion = MappingRule;
export const generateMappingSuggestions = applyMappingRules;