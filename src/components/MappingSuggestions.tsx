import { useState } from "react";
import type { MappingRule as MappingSuggestion, MappingCategory } from "../utils/mappingRules";
import type { ParsedContract } from "../utils/solidityParser";

interface Props {
  suggestions: MappingSuggestion[];
  parsed: ParsedContract;
}

const CATEGORY_LABELS: Record<MappingCategory, { label: string; icon: string; color: string }> = {
  state:   { label: "State / Storage", icon: "📦", color: "var(--accent)" },
  token:   { label: "Token Standard",  icon: "🪙", color: "var(--yellow)" },
  access:  { label: "Access Control",  icon: "🔐", color: "var(--accent2)" },
  event:   { label: "Events / Logs",   icon: "📡", color: "var(--accent3)" },
  pattern: { label: "Patterns",        icon: "🔁", color: "#fb6819" },
  storage: { label: "Mapping / Storage", icon: "🗄", color: "var(--red)" },
};

const COMPLEXITY_COLOR: Record<string, string> = {
  low: "var(--accent3)",
  medium: "var(--yellow)",
  high: "var(--red)",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button className="copy-btn" onClick={copy}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function MappingSuggestions({ suggestions }: Props) {
  const [filter, setFilter] = useState<MappingCategory | "all">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(suggestions.map((s) => s.category)));
  const filtered = filter === "all" ? suggestions : suggestions.filter((s) => s.category === filter);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🗺</span>
          <div>
            <div className="card-title">EVM → Solana Account Model Mapping</div>
            <div className="card-subtitle">{suggestions.length} suggestions generated</div>
          </div>
        </div>

        <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
          Solana's account model is fundamentally different from EVM storage slots. Every piece of
          state lives in an account owned by a program. Mappings become PDAs; functions become
          instructions; events become Anchor events emitted via <code style={{ fontFamily: "var(--mono)", color: "var(--accent3)" }}>emit!()</code>.
        </p>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilter("all")}
            className={`tag ${filter === "all" ? "tag-orange" : ""}`}
            style={{ cursor: "pointer", border: "1px solid var(--border2)", background: filter === "all" ? "" : "var(--bg3)", color: filter === "all" ? "" : "var(--text2)" }}
          >
            All ({suggestions.length})
          </button>
          {categories.map((cat) => {
            const meta = CATEGORY_LABELS[cat];
            const count = suggestions.filter((s) => s.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="tag"
                style={{
                  cursor: "pointer",
                  border: `1px solid ${filter === cat ? meta.color : "var(--border2)"}`,
                  background: filter === cat ? `${meta.color}20` : "var(--bg3)",
                  color: filter === cat ? meta.color : "var(--text2)",
                }}
              >
                {meta.icon} {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Mapping rows */}
      {filtered.map((s) => {
        const meta = CATEGORY_LABELS[s.category];
        const isExpanded = expanded.has(s.id);
        return (
          <div key={s.id} style={{ marginBottom: 12 }}>
            <div
              className="mapping-row"
              style={{ cursor: "pointer" }}
              onClick={() => toggleExpand(s.id)}
            >
              {/* EVM side */}
              <div>
                <div className="mapping-side-label">EVM / Solidity</div>
                <div className="mapping-concept" style={{ color: "#627EEA" }}>
                  {s.evmConcept}
                </div>
                <div className="mapping-note">{s.evmDetail}</div>
              </div>

              {/* Arrow */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, color: meta.color }}>→</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", textTransform: "uppercase" }}>
                  {meta.icon} {s.category}
                </div>
              </div>

              {/* Solana side */}
              <div>
                <div className="mapping-side-label">Solana / Anchor</div>
                <div className="mapping-concept" style={{ color: "var(--accent3)" }}>
                  {s.solanaConcept}
                </div>
                <div className="mapping-note" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
                  {s.solanaDetail}
                </div>
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border2)",
                  borderTop: "none",
                  borderRadius: "0 0 var(--radius) var(--radius)",
                  padding: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span className="tag" style={{
                    background: `${COMPLEXITY_COLOR[s.complexity]}20`,
                    color: COMPLEXITY_COLOR[s.complexity],
                    border: `1px solid ${COMPLEXITY_COLOR[s.complexity]}40`,
                  }}>
                    {s.complexity} complexity
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>Rationale</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: s.anchor_snippet ? 16 : 0 }}>
                  {s.rationale}
                </p>

                {s.anchor_snippet && (
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                      Anchor snippet
                    </div>
                    <div className="code-block" style={{ position: "relative" }}>
                      <CopyButton text={s.anchor_snippet} />
                      <pre>{s.anchor_snippet}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Quick reference table */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <span className="card-icon">📋</span>
          <div className="card-title">Quick Reference: EVM → SVM Concept Map</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Solidity / EVM", "Solana / Anchor", "Notes"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "1px", fontSize: 10 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["contract storage", "#[account] struct", "Borsh-serialized; must pre-allocate space"],
                ["mapping(K => V)", "PDA per key", "Seeds: [b\"prefix\", key.as_ref()]"],
                ["msg.sender", "ctx.accounts.signer.key()", "Must be Signer<'info>"],
                ["onlyOwner modifier", "constraint = signer.key() == state.authority", "Explicit in Context struct"],
                ["emit Event(…)", "emit!(MyEvent { … })", "Decoded by Anchor client"],
                ["ERC-20", "SPL Token + ATAs", "No custom logic needed for transfers"],
                ["ERC-721", "Token (supply=1) + Metaplex", "Metadata via mpl-token-metadata"],
                ["constructor", "initialize instruction", "Sets bump, authority, initial state"],
                ["require(cond, msg)", "require!(cond, ErrorCode::Variant)", "Custom #[error_code] enum"],
                ["block.timestamp", "Clock::get()?.unix_timestamp", "Must be passed via Sysvar"],
              ].map(([evm, sol, note]) => (
                <tr key={evm} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 12px", color: "#627EEA" }}>{evm}</td>
                  <td style={{ padding: "10px 12px", color: "var(--accent3)" }}>{sol}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text2)" }}>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}