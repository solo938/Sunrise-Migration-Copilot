import { useState, useCallback } from "react";
import type { ParsedContract } from "../utils/solidityParser";
import type { MappingRule } from "../utils/mappingRules";
import type { AnchorSkeleton } from "../utils/anchorGenerator";

interface Props {
  parsed: ParsedContract;
  mappings: MappingRule[];
  skeleton: AnchorSkeleton | null;
}

type Priority = "critical" | "high" | "medium" | "low";

interface ChecklistItem {
  id: string;
  section: string;
  text: string;
  priority: Priority;
  detail?: string;
  automated: boolean;
}

const PRIORITY_COLOR: Record<Priority, string> = {
  critical: "var(--red)",
  high:     "var(--accent)",
  medium:   "var(--yellow)",
  low:      "var(--accent3)",
};
const PRIORITY_LABEL: Record<Priority, string> = {
  critical: "CRITICAL",
  high:     "HIGH",
  medium:   "MED",
  low:      "LOW",
};

// ── Build dynamic checklist from parsed data ───────────────────────────
function buildChecklist(
  parsed: ParsedContract,
  _mappings: MappingRule[],
  skeleton: AnchorSkeleton | null
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let i = 0;
  const id = () => `chk-${++i}`;

  // ── Analysis ──────────────────────────────────────────────────────────
  items.push(
    { id: id(), section: "Analysis", text: "Parse Solidity source code", priority: "critical", automated: true },
    { id: id(), section: "Analysis", text: `Detected token standard: ${parsed.isERC20 ? "ERC-20" : parsed.isERC721 ? "ERC-721" : "Custom"}`, priority: "critical", automated: true },
    { id: id(), section: "Analysis", text: "Review all state variable → Solana account field mappings", priority: "high", automated: false },
    { id: id(), section: "Analysis", text: "Identify all external contract calls / CPIs required", priority: "high", automated: false, detail: "EVM external calls become Anchor CPIs. Each called program must be included in the Context struct." },
    { id: id(), section: "Analysis", text: "Document business logic that must be preserved exactly", priority: "critical", automated: false },
    { id: id(), section: "Analysis", text: `Contract complexity: ${parsed.complexity} (${parsed.lineCount} lines)`, priority: parsed.complexity === "high" ? "high" : "medium", automated: true },
  );

  if (parsed.hasMappings) {
    const mappingCount = parsed.contracts
      .flatMap((c) => c.stateVariables)
      .filter((v) => v.typeName.startsWith("mapping")).length;
    items.push({
      id: id(), section: "Analysis",
      text: `Design PDA seed scheme for ${mappingCount} mapping(s)`,
      priority: "critical", automated: false,
      detail: "Each mapping entry = 1 PDA. Seeds must be unique per entry. Store the bump in the account.",
    });
  }

  // ── Program Dev ───────────────────────────────────────────────────────
  items.push(
    { id: id(), section: "Program Dev", text: "Anchor skeleton generated (lib.rs, Anchor.toml, Cargo.toml, tests)", priority: "high", automated: !!skeleton },
    { id: id(), section: "Program Dev", text: "Implement all instruction handlers (replace TODO blocks in lib.rs)", priority: "critical", automated: false },
    { id: id(), section: "Program Dev", text: "Verify account space (LEN) for every #[account] struct", priority: "critical", automated: false, detail: "Under-allocated accounts fail at init. Add 64+ bytes headroom. Anchor discriminator = 8 bytes." },
    { id: id(), section: "Program Dev", text: "Add typed error codes for all business rule violations", priority: "high", automated: false },
    { id: id(), section: "Program Dev", text: "Implement Anchor #[event] + emit!() for all Solidity events", priority: "medium", automated: false },
    { id: id(), section: "Program Dev", text: "`anchor build` — zero compiler errors or warnings", priority: "critical", automated: false },
  );

  if (skeleton) {
    for (const inst of skeleton.instructions.slice(0, 5)) {
      items.push({ id: id(), section: "Program Dev", text: `Implement instruction: ${inst}`, priority: "critical", automated: false });
    }
  }

  if (parsed.isERC20) {
    items.push(
      { id: id(), section: "Program Dev", text: "Deploy SPL Token mint (match ERC-20 decimals)", priority: "critical", automated: false },
      { id: id(), section: "Program Dev", text: "Integrate anchor_spl::token for transfer / mint / burn", priority: "high", automated: false },
      { id: id(), section: "Program Dev", text: "Test Associated Token Account (ATA) creation flow", priority: "high", automated: false },
    );
  }

  if (parsed.isERC721) {
    items.push(
      { id: id(), section: "Program Dev", text: "Integrate Metaplex Token Metadata for NFT metadata URI", priority: "high", automated: false },
      { id: id(), section: "Program Dev", text: "Implement mint-per-NFT with supply=1, decimals=0", priority: "high", automated: false },
    );
  }

  if (parsed.hasOwnable || parsed.hasAccessControl) {
    items.push({
      id: id(), section: "Program Dev",
      text: "Implement authority / role checks in all privileged instructions",
      priority: "critical", automated: false,
      detail: "Use `has_one = authority` or `constraint = authority.key() == state.authority @ ErrorCode::Unauthorized`.",
    });
  }

  // ── Testing ───────────────────────────────────────────────────────────
  items.push(
    { id: id(), section: "Testing", text: "Write unit test for initialize instruction", priority: "critical", automated: false },
    { id: id(), section: "Testing", text: "Write tests for all public instruction handlers", priority: "critical", automated: false },
    { id: id(), section: "Testing", text: "Test PDA derivation and account creation/closure", priority: "high", automated: false },
    { id: id(), section: "Testing", text: "Test unauthorized access rejection", priority: "high", automated: false },
    { id: id(), section: "Testing", text: "`anchor test` — all tests passing on localnet", priority: "critical", automated: false },
    { id: id(), section: "Testing", text: "Use LiteSVM or Mollusk for fast in-process unit tests", priority: "medium", automated: false, detail: "Much faster than spinning up a test-validator. Great for unit-testing individual instructions." },
    { id: id(), section: "Testing", text: "Integration test against devnet with real token accounts", priority: "high", automated: false },
  );

  // ── Security ──────────────────────────────────────────────────────────
  items.push(
    { id: id(), section: "Security", text: "Verify all account owner checks (program owns PDAs)", priority: "critical", automated: false },
    { id: id(), section: "Security", text: "Validate all account constraints in Context structs", priority: "critical", automated: false },
    { id: id(), section: "Security", text: "Ensure no account is writable that should be read-only", priority: "critical", automated: false },
    { id: id(), section: "Security", text: "Check for integer overflow — use checked_add, checked_mul", priority: "critical", automated: false },
    { id: id(), section: "Security", text: "Signer spoofing prevention — all privileged callers use Signer<'info>", priority: "critical", automated: false },
    { id: id(), section: "Security", text: "Audit CPI flows — verify callee program IDs match expected", priority: "high", automated: false },
    { id: id(), section: "Security", text: "Review compute unit usage — add ComputeBudget instruction if >200k CUs", priority: "medium", automated: false },
    { id: id(), section: "Security", text: "Run `anchor idl --out idl.json` and review for unintended exposure", priority: "medium", automated: false },
    { id: id(), section: "Security", text: "Request peer code review or professional audit before mainnet", priority: "high", automated: false },
  );

  // ── Token Migration ───────────────────────────────────────────────────
  if (parsed.isERC20 || parsed.isERC721) {
    items.push(
      { id: id(), section: "Token Migration", text: "Install @wormhole-foundation/sdk", priority: "critical", automated: false, detail: "npm install @wormhole-foundation/sdk @wormhole-foundation/sdk-evm @wormhole-foundation/sdk-solana" },
      { id: id(), section: "Token Migration", text: "Initialize Wormhole SDK: wormhole('Testnet', [evm, solana])", priority: "critical", automated: false },
      { id: id(), section: "Token Migration", text: "Snapshot all EVM token holders and balances", priority: "critical", automated: false },
      { id: id(), section: "Token Migration", text: "Verify total supply matches sum of all holder balances", priority: "critical", automated: false },
      { id: id(), section: "Token Migration", text: "Collect EVM address → Solana wallet mapping from holders", priority: "critical", automated: false },
      { id: id(), section: "Token Migration", text: "Deploy and test NTT Manager + Transceiver on testnet (Sepolia → devnet)", priority: "high", automated: false },
      { id: id(), section: "Token Migration", text: "Run end-to-end NTT transfer test using TypeScript SDK", priority: "high", automated: false },
      { id: id(), section: "Token Migration", text: "Apply to Sunrise for liquidity routing (sunrisedefi.com)", priority: "high", automated: false, detail: "Sunrise is the canonical gateway for new assets entering Solana with native liquidity." },
      { id: id(), section: "Token Migration", text: "Distribute SPL tokens to holders on mainnet", priority: "critical", automated: false },
      { id: id(), section: "Token Migration", text: "Revoke mint authority after full distribution (fixed supply)", priority: "medium", automated: false },
      { id: id(), section: "Token Migration", text: "Deploy liquidity pool on Orca or Raydium", priority: "medium", automated: false },
    );
  }

  // ── Deployment ────────────────────────────────────────────────────────
  items.push(
    { id: id(), section: "Deployment", text: "`anchor deploy` to devnet — verify program ID matches Anchor.toml", priority: "critical", automated: false },
    { id: id(), section: "Deployment", text: "Run full test suite against devnet deployment", priority: "critical", automated: false },
    { id: id(), section: "Deployment", text: "Verify program upgrade authority wallet is secure", priority: "high", automated: false },
    { id: id(), section: "Deployment", text: "`anchor deploy` to mainnet-beta", priority: "critical", automated: false },
    { id: id(), section: "Deployment", text: "Verify on Solana Explorer (explorer.solana.com)", priority: "high", automated: false },
    { id: id(), section: "Deployment", text: "Publish IDL on-chain: `anchor idl init <programId>`", priority: "medium", automated: false },
    { id: id(), section: "Deployment", text: "Update frontend / SDK with mainnet program ID", priority: "critical", automated: false },
    { id: id(), section: "Deployment", text: "Monitor for errors in first 48 hours using Helius / Shyft alerts", priority: "high", automated: false },
  );

  return items;
}

// ── Export helpers ─────────────────────────────────────────────────────
function exportMarkdown(
  items: ChecklistItem[],
  checked: Set<string>,
  parsed: ParsedContract,
  totalChecked: number,
  progress: number
): void {
  const lines = [
    "# Sunrise Migration Copilot — Migration Checklist",
    "",
    `**Contract:** ${parsed.contracts[0]?.name ?? "Unknown"}`,
    `**Token standard:** ${parsed.isERC20 ? "ERC-20" : parsed.isERC721 ? "ERC-721" : "Custom"}`,
    `**Complexity:** ${parsed.complexity}`,
    `**Progress:** ${totalChecked}/${items.length} (${progress}%)`,
    `**Generated:** ${new Date().toISOString().split("T")[0]}`,
    "",
    "---",
    "",
  ];

  const grouped: Record<string, ChecklistItem[]> = {};
  for (const item of items) {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  }

  for (const [section, sectionItems] of Object.entries(grouped)) {
    const done = sectionItems.filter((i) => checked.has(i.id)).length;
    lines.push(`## ${section} (${done}/${sectionItems.length})`, "");
    for (const item of sectionItems) {
      const check = checked.has(item.id) ? "x" : " ";
      const prio = `\`[${PRIORITY_LABEL[item.priority]}]\``;
      const auto = item.automated ? " _(auto)_" : "";
      lines.push(`- [${check}] ${prio}${auto} ${item.text}`);
      if (item.detail) lines.push(`  > ${item.detail}`);
    }
    lines.push("");
  }

  lines.push("---", "", "_Generated by [Sunrise Migration Copilot](https://github.com/sunrise-migration-copilot)_");

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "migration-checklist.md";
  a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(
  items: ChecklistItem[],
  checked: Set<string>,
  parsed: ParsedContract
): void {
  const payload = {
    meta: {
      contract: parsed.contracts[0]?.name ?? "Unknown",
      tokenStandard: parsed.isERC20 ? "ERC-20" : parsed.isERC721 ? "ERC-721" : "Custom",
      complexity: parsed.complexity,
      generatedAt: new Date().toISOString(),
    },
    items: items.map((item) => ({
      ...item,
      checked: checked.has(item.id),
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "migration-checklist.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────────────────
export default function ChecklistExport({ parsed, mappings, skeleton }: Props) {
  const items = buildChecklist(parsed, mappings, skeleton);
  const [checked, setChecked] = useState<Set<string>>(
    new Set(items.filter((i) => i.automated).map((i) => i.id))
  );
  const [filterSection, setFilterSection] = useState("All");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  const sections = ["All", ...Array.from(new Set(items.map((i) => i.section)))];
  const priorities: Array<Priority | "all"> = ["all", "critical", "high", "medium", "low"];

  const filtered = items.filter((item) => {
    const sectionOk = filterSection === "All" || item.section === filterSection;
    const priorityOk = filterPriority === "all" || item.priority === filterPriority;
    return sectionOk && priorityOk;
  });

  const totalChecked = items.filter((i) => checked.has(i.id)).length;
  const progress = Math.round((totalChecked / items.length) * 100);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const checkAll = () => setChecked(new Set(filtered.map((i) => i.id)));
  const uncheckAll = () =>
    setChecked((prev) => {
      const next = new Set(prev);
      filtered.forEach((i) => next.delete(i.id));
      return next;
    });

  return (
    <div>
      {/* Header card */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">✅</span>
          <div>
            <div className="card-title">Migration Checklist</div>
            <div className="card-subtitle">
              {items.length} items · {sections.length - 1} sections
            </div>
          </div>

          {/* Export buttons */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              className="export-btn"
              onClick={() => exportMarkdown(items, checked, parsed, totalChecked, progress)}
            >
              ⬇ Markdown
            </button>
            <button
              className="export-btn"
              onClick={() => exportJSON(items, checked, parsed)}
            >
              ⬇ JSON
            </button>
          </div>
        </div>

        {/* Overall progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text2)" }}>Overall Progress</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--accent3)" }}>
              {totalChecked} / {items.length} ({progress}%)
            </span>
          </div>
          <div className="progress-bar-wrap" style={{ height: 10 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, var(--accent2), var(--accent3))`,
              }}
            />
          </div>
        </div>

        {/* Section progress mini-bars */}
        <div className="grid-3" style={{ gap: 10, marginBottom: 20 }}>
          {sections.slice(1).map((sec) => {
            const secItems = items.filter((i) => i.section === sec);
            const secDone = secItems.filter((i) => checked.has(i.id)).length;
            const pct = Math.round((secDone / secItems.length) * 100);
            return (
              <div
                key={sec}
                style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", padding: 12, cursor: "pointer" }}
                onClick={() => { setFilterSection(sec === filterSection ? "All" : sec); }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: filterSection === sec ? "var(--accent)" : "var(--text)" }}>
                  {sec}
                </div>
                <div className="progress-bar-wrap" style={{ height: 4, marginBottom: 4 }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct === 100 ? "var(--accent3)" : "var(--accent)" }} />
                </div>
                <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)" }}>
                  {secDone}/{secItems.length}
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setFilterSection(s)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: `1px solid ${filterSection === s ? "var(--accent)" : "var(--border2)"}`,
                background: filterSection === s ? "rgba(247,147,26,0.15)" : "var(--bg3)",
                color: filterSection === s ? "var(--accent)" : "var(--text2)",
                fontFamily: "var(--sans)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {priorities.map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: `1px solid ${filterPriority === p ? (p === "all" ? "var(--text2)" : PRIORITY_COLOR[p]) : "var(--border2)"}`,
                background: filterPriority === p ? (p === "all" ? "rgba(255,255,255,0.05)" : `${PRIORITY_COLOR[p]}15`) : "var(--bg3)",
                color: filterPriority === p ? (p === "all" ? "var(--text)" : PRIORITY_COLOR[p]) : "var(--text3)",
                fontFamily: "var(--sans)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {p === "all" ? "All priorities" : PRIORITY_LABEL[p as Priority]}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="export-btn" style={{ padding: "5px 14px", fontSize: 12 }} onClick={checkAll}>
              Check visible
            </button>
            <button className="export-btn" style={{ padding: "5px 14px", fontSize: 12 }} onClick={uncheckAll}>
              Uncheck visible
            </button>
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div className="card">
        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12, fontFamily: "var(--mono)" }}>
          Showing {filtered.length} of {items.length} items
        </div>

        {filtered.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <div
              key={item.id}
              className="checklist-item"
              style={{ opacity: isChecked ? 0.7 : 1, transition: "opacity 0.2s" }}
            >
              {/* Checkbox */}
              <div
                className={`checklist-check ${isChecked ? "checked" : ""}`}
                onClick={() => toggle(item.id)}
                title={item.automated ? "Auto-completed" : "Click to toggle"}
              >
                {isChecked && "✓"}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                  <span
                    className={`checklist-text ${isChecked ? "checked" : ""}`}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    {item.text}
                  </span>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, flexWrap: "wrap" }}>
                    {item.automated && (
                      <span className="tag tag-green" style={{ fontSize: 9 }}>AUTO ✓</span>
                    )}
                    <span
                      className="tag"
                      style={{
                        background: `${PRIORITY_COLOR[item.priority]}15`,
                        color: PRIORITY_COLOR[item.priority],
                        border: `1px solid ${PRIORITY_COLOR[item.priority]}30`,
                        fontSize: 9,
                      }}
                    >
                      {PRIORITY_LABEL[item.priority]}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", alignSelf: "center" }}>
                      {item.section}
                    </span>
                  </div>
                </div>
                {item.detail && !isChecked && (
                  <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.6, borderLeft: "2px solid var(--border2)", paddingLeft: 10, marginTop: 8 }}>
                    {item.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Priority legend */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🏷</span>
          <div className="card-title">Priority Guide</div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {(["critical", "high", "medium", "low"] as Priority[]).map((p) => {
            const count = items.filter((i) => i.priority === p).length;
            const done = items.filter((i) => i.priority === p && checked.has(i.id)).length;
            return (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, minWidth: 200 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: PRIORITY_COLOR[p], flexShrink: 0 }} />
                <div>
                  <span style={{ color: PRIORITY_COLOR[p], fontWeight: 700 }}>{PRIORITY_LABEL[p]}</span>
                  <span style={{ color: "var(--text2)", marginLeft: 6 }}>
                    {{
                      critical: "— Required before launch",
                      high:     "— Strongly recommended",
                      medium:   "— Best practice",
                      low:      "— Nice to have",
                    }[p]}
                  </span>
                  <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 2 }}>
                    {done}/{count} done
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wormhole SDK quick reference */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🌉</span>
          <div className="card-title">Wormhole SDK Quick Reference</div>
          <a
            href="https://wormhole.com/docs/tools/typescript-sdk/get-started/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: "auto", fontSize: 12, color: "var(--accent2)", fontFamily: "var(--mono)" }}
          >
            Docs ↗
          </a>
        </div>
        <div className="code-block">
          <pre style={{ fontSize: 11 }}>{`# Install
npm install @wormhole-foundation/sdk

# Initialize (TypeScript)
import { wormhole } from "@wormhole-foundation/sdk";
import evm    from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";

const wh = await wormhole("Testnet", [evm, solana]);

# Get chain info
const sol = wh.getChain("Solana");
console.log(sol.config.chainId); // 1
console.log(sol.config.rpc);     // https://api.devnet.solana.com`}</pre>
        </div>
      </div>
    </div>
  );
}