// AnchorSkeleton.tsx  (was AnchorSkeletonDisplay.tsx — renamed to match your directory)
import { useState } from "react";
import type { AnchorSkeleton as AnchorSkeletonType } from "../utils/anchorGenerator";
import type { AnchorFile } from "../utils/anchorGenerator";

interface Props {
  skeleton: AnchorSkeletonType;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy-btn"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

const LANG_COLORS: Record<string, string> = {
  rust:       "var(--accent)",
  toml:       "var(--accent2)",
  typescript: "#3178c6",
};

export default function AnchorSkeleton({ skeleton }: Props) {
  const [activeFile, setActiveFile] = useState(0);

  const currentFile: AnchorFile = skeleton.files[activeFile];

  return (
    <div>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">⚓</span>
          <div>
            <div className="card-title">Anchor Program Skeleton</div>
            <div className="card-subtitle">Program: {skeleton.programName}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span className="tag tag-orange">{skeleton.instructions.length} instructions</span>
            <span className="tag tag-purple">{skeleton.accountStructs.length} account types</span>
          </div>
        </div>

        {/* Warnings */}
        {skeleton.warnings.length > 0 && (
          <div style={{ background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.3)", borderRadius: "var(--radius)", padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--yellow)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
              ⚠ Migration Notices
            </div>
            {skeleton.warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 13, color: "var(--text2)", padding: "4px 0", display: "flex", gap: 8 }}>
                <span style={{ color: "var(--yellow)" }}>→</span> {w}
              </div>
            ))}
          </div>
        )}

        {/* Instructions + Account structs */}
        <div className="grid-2">
          <div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
              Instructions
            </div>
            {["initialize", ...skeleton.instructions].map((inst) => (
              <div key={inst} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--accent3)", fontFamily: "var(--mono)", fontSize: 12 }}>fn</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{inst}</span>
                <span className="tag tag-orange" style={{ marginLeft: "auto", fontSize: 10 }}>instruction</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
              Account Structs
            </div>
            {skeleton.accountStructs.map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--accent2)", fontFamily: "var(--mono)", fontSize: 12 }}>#[account]</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* File viewer */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* File tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
          {skeleton.files.map((file, i) => {
            const parts  = file.filename.split("/");
            const name   = parts[parts.length - 1];
            const active = i === activeFile;
            return (
              <button
                key={file.filename}
                onClick={() => setActiveFile(i)}
                style={{
                  padding: "12px 20px",
                  background: active ? "var(--bg)" : "transparent",
                  border: "none",
                  borderRight: "1px solid var(--border)",
                  borderBottom: active ? `2px solid ${LANG_COLORS[file.language]}` : "2px solid transparent",
                  color: active ? LANG_COLORS[file.language] : "var(--text3)",
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* File path + copy */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg3)" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
            📁 {currentFile.filename}
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="tag" style={{ background: `${LANG_COLORS[currentFile.language]}20`, color: LANG_COLORS[currentFile.language], border: `1px solid ${LANG_COLORS[currentFile.language]}30` }}>
              {currentFile.language}
            </span>
            <button
              style={{ background: "var(--bg2)", border: "1px solid var(--border2)", color: "var(--text2)", fontFamily: "var(--mono)", fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}
              onClick={() => navigator.clipboard.writeText(currentFile.content)}
            >
              Copy file
            </button>
          </div>
        </div>

        {/* Code */}
        <div style={{ background: "var(--bg)", padding: 20, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", overflowX: "auto", maxHeight: 520, overflowY: "auto", lineHeight: 1.8 }}>
          <pre style={{ whiteSpace: "pre", tabSize: 4 }}>{currentFile.content}</pre>
        </div>
      </div>

      {/* Build & deploy commands */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🚀</span>
          <div className="card-title">Build &amp; Deploy Commands</div>
        </div>
        <div className="code-block" style={{ position: "relative" }}>
          <CopyButton text={`anchor init ${skeleton.programName}\ncd ${skeleton.programName}\nanchor build\nsolana config set --url devnet\nsolana airdrop 2\nanchor deploy\nanchor test`} />
          <pre>{`# 1. Init project
anchor init ${skeleton.programName}
cd ${skeleton.programName}

# 2. Replace programs/${skeleton.programName}/src/lib.rs with generated skeleton
# Then build:
anchor build

# 3. Deploy to devnet
solana config set --url devnet
solana airdrop 2
anchor deploy

# 4. Run tests
anchor test`}</pre>
        </div>
      </div>

      {/* Account space table */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">📐</span>
          <div className="card-title">Account Space Reference</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Type", "Bytes", "Notes"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "1px", fontSize: 10 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Discriminator", "8",         "Always required for Anchor accounts"],
                ["Pubkey",        "32",         "address / authority fields"],
                ["u64 / i64",     "8",          "uint256 / int256 (truncated)"],
                ["u32",           "4",          "uint32"],
                ["u8 / bool",     "1",          "uint8 / bool"],
                ["[u8; 32]",      "32",         "bytes32"],
                ["String",        "4 + len",    "length prefix + UTF-8 bytes"],
                ["Vec<T>",        "4 + n×size", "length prefix + elements"],
                ["Option<T>",     "1 + size",   "discriminant byte + inner"],
                ["bump (u8)",     "1",          "PDA bump — always store it"],
              ].map(([type, bytes, note]) => (
                <tr key={type} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 12px", color: "var(--accent3)" }}>{type}</td>
                  <td style={{ padding: "8px 12px", color: "var(--accent)" }}>{bytes}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text2)" }}>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}