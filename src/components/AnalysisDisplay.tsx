// AnalysisDisplay.tsx  (was AnalysisResults.tsx — renamed to match your directory)
import { useState } from "react";
import type { ParsedContract } from "../utils/solidityParser";

interface Props {
  parsed: ParsedContract;
  source: string;
}

export default function AnalysisDisplay({ parsed, source }: Props) {
  const [showSource, setShowSource] = useState(false);
  const mainContract = parsed.contracts.find((c) => c.kind === "contract") ?? parsed.contracts[0];

  if (!mainContract) return <div className="card">No contract found in source.</div>;

  const publicFns  = mainContract.functions.filter((f) => f.visibility === "public" || f.visibility === "external");
  const privateFns = mainContract.functions.filter((f) => f.visibility === "private" || f.visibility === "internal");

  const complexityColor = { low: "var(--accent3)", medium: "var(--yellow)", high: "var(--red)" }[parsed.complexity];

  return (
    <div>
      {/* Summary card */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🔍</span>
          <div>
            <div className="card-title">Contract Analysis — {mainContract.name}</div>
            <div className="card-subtitle">{parsed.lineCount} lines · pragma {parsed.pragmaVersion}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {parsed.isERC20 && <span className="tag tag-orange">ERC-20</span>}
            {parsed.isERC721 && <span className="tag tag-purple">ERC-721</span>}
            {parsed.hasOwnable && <span className="tag tag-green">Ownable</span>}
            {parsed.hasAccessControl && <span className="tag tag-purple">AccessControl</span>}
            <span className="tag" style={{ background: `${complexityColor}20`, color: complexityColor, border: `1px solid ${complexityColor}50` }}>
              {parsed.complexity} complexity
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="stat-box">
            <div className="stat-label">Contracts</div>
            <div className="stat-value" style={{ color: "var(--accent)" }}>{parsed.contracts.length}</div>
            <div className="stat-desc">{parsed.contracts.map((c) => c.name).join(", ")}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Functions</div>
            <div className="stat-value" style={{ color: "var(--accent2)" }}>{mainContract.functions.length}</div>
            <div className="stat-desc">{publicFns.length} public · {privateFns.length} private</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">State Variables</div>
            <div className="stat-value" style={{ color: "var(--accent3)" }}>{mainContract.stateVariables.length}</div>
            <div className="stat-desc">
              {mainContract.stateVariables.filter((v) => v.typeName.startsWith("mapping")).length} mappings
            </div>
          </div>
        </div>

        {/* Inheritance */}
        {mainContract.baseContracts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
              Inherits from
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {mainContract.baseContracts.map((b) => (
                <span key={b} className="tag tag-purple">{b}</span>
              ))}
            </div>
          </div>
        )}

        {/* Imports */}
        {parsed.imports.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
              Imports ({parsed.imports.length})
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {parsed.imports.map((imp) => (
                <span key={imp} style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text2)", background: "var(--bg3)", padding: "3px 8px", borderRadius: 4 }}>
                  {imp.split("/").pop()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* State variables */}
        <div className="card">
          <div className="card-header">
            <span className="card-icon">📦</span>
            <div className="card-title">State Variables</div>
          </div>
          {mainContract.stateVariables.length === 0 ? (
            <p style={{ color: "var(--text3)", fontSize: 13 }}>No state variables found.</p>
          ) : (
            mainContract.stateVariables.map((v) => (
              <div key={v.name} className="list-item">
                <div className="list-item-body">
                  <div className="list-item-title" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                    <span style={{ color: "var(--accent2)" }}>{v.typeName}</span>{" "}
                    <span style={{ color: "var(--accent3)" }}>{v.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <span className="tag tag-orange">{v.visibility}</span>
                    {v.constant  && <span className="tag tag-green">constant</span>}
                    {v.immutable && <span className="tag tag-purple">immutable</span>}
                    {v.typeName.startsWith("mapping") && <span className="tag tag-red">→ PDA</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Events */}
        <div className="card">
          <div className="card-header">
            <span className="card-icon">📡</span>
            <div className="card-title">Events</div>
          </div>
          {mainContract.events.length === 0 ? (
            <p style={{ color: "var(--text3)", fontSize: 13 }}>No events defined.</p>
          ) : (
            mainContract.events.map((e) => (
              <div key={e.name} className="list-item">
                <div className="list-item-body">
                  <div className="list-item-title" style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--yellow)" }}>
                    {e.name}
                  </div>
                  <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--text3)", marginTop: 4 }}>
                    {e.parameters.map((p) => `${p.typeName}${p.indexed ? " indexed" : ""} ${p.name}`).join(", ")}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className="tag tag-green">→ Anchor #[event]</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Functions */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">⚡</span>
          <div className="card-title">Functions ({mainContract.functions.length})</div>
        </div>
        {mainContract.functions.map((f) => (
          <div key={`${f.name}-${f.isConstructor}`} className="fn-row">
            <div>
              <span style={{ fontFamily: "var(--mono)", color: "var(--accent3)", fontWeight: 700 }}>
                {f.isConstructor ? "constructor" : f.name}
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text3)" }}>
                ({f.parameters.map((p) => `${p.typeName} ${p.name}`).join(", ")})
              </span>
            </div>
            <div className="fn-meta">
              <span className={`tag ${f.visibility === "public" || f.visibility === "external" ? "tag-orange" : "tag-purple"}`}>
                {f.visibility}
              </span>
              {f.stateMutability !== "nonpayable" && (
                <span className={`tag ${f.stateMutability === "view" || f.stateMutability === "pure" ? "tag-green" : "tag-orange"}`}>
                  {f.stateMutability}
                </span>
              )}
              {f.isConstructor && <span className="tag tag-purple">constructor</span>}
              {!f.isConstructor && (f.visibility === "public" || f.visibility === "external") && (
                <span className="tag tag-green">→ instruction</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Source preview toggle */}
      <div className="card">
        <div className="card-header" style={{ cursor: "pointer" }} onClick={() => setShowSource(!showSource)}>
          <span className="card-icon">📝</span>
          <div className="card-title">Source Code</div>
          <button style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 13 }}>
            {showSource ? "Hide ▲" : "Show ▼"}
          </button>
        </div>
        {showSource && <div className="source-preview">{source}</div>}
      </div>

      {/* Parse errors */}
      {parsed.errors.length > 0 && (
        <div className="card" style={{ borderColor: "var(--red)" }}>
          <div className="card-header">
            <span className="card-icon">⚠</span>
            <div className="card-title" style={{ color: "var(--red)" }}>Parse Warnings</div>
          </div>
          {parsed.errors.map((e, i) => (
            <div key={i} style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--red)", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              {e}
            </div>
          ))}
          <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 12 }}>
            Using regex fallback parser — results may be approximate. Install{" "}
            <code>@solidity-parser/parser</code> for full AST parsing.
          </p>
        </div>
      )}
    </div>
  );
}