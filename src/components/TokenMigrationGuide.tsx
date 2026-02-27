// TokenMigrationGuide.tsx  
import { useState } from "react";
import { buildMigrationPlan, getNTTTransferSnippet, getSDKInitSnippet } from "../utils/wormholeDemo";
import type { ParsedContract } from "../utils/solidityParser";

interface Props {
  parsed: ParsedContract;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button className="copy-btn" onClick={() => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function getNTTSnippet(): string {
  return getNTTTransferSnippet();
}

export default function TokenMigrationGuide({ parsed }: Props) {
  const mainContract = parsed.contracts[0];
  const tokenName    = mainContract?.name ?? "MyToken";
  const plan         = buildMigrationPlan(tokenName, parsed.isERC20, parsed.isERC721);

  const [activeStep, setActiveStep]         = useState(0);
  const [showTransferCode, setShowTransferCode] = useState(false);
  const [showSDKInit, setShowSDKInit]       = useState(false);

  const step = plan.steps[activeStep];

  return (
    <div>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🌉</span>
          <div>
            <div className="card-title">Token Migration — Wormhole NTT + Sunrise</div>
            <div className="card-subtitle">
              Step-by-step bridge plan · Est. {plan.estimatedTime}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {parsed.isERC20  && <span className="tag tag-orange">ERC-20 → SPL Token</span>}
            {parsed.isERC721 && <span className="tag tag-purple">ERC-721 → Metaplex NFT</span>}
          </div>
        </div>

        {/* SDK init quick reference */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: showSDKInit ? 12 : 0 }}
            onClick={() => setShowSDKInit(!showSDKInit)}
          >
            <span style={{ fontSize: 13, color: "var(--accent2)", fontFamily: "var(--mono)" }}>
              npm install @wormhole-foundation/sdk
            </span>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>
              {showSDKInit ? "▲ hide" : "▼ show init snippet"}
            </span>
            <a
              href="https://wormhole.com/docs/tools/typescript-sdk/get-started/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: "auto", fontSize: 11, color: "var(--accent2)", fontFamily: "var(--mono)" }}
              onClick={(e) => e.stopPropagation()}
            >
              SDK Docs ↗
            </a>
          </div>
          {showSDKInit && (
            <div className="code-block" style={{ position: "relative" }}>
              <CopyButton text={getSDKInitSnippet()} />
              <pre style={{ fontSize: 11 }}>{getSDKInitSnippet()}</pre>
            </div>
          )}
        </div>

        {/* Sunrise note */}
        <div style={{ background: "linear-gradient(135deg, rgba(153,69,255,0.12), rgba(25,251,155,0.08))", border: "1px solid rgba(153,69,255,0.3)", borderRadius: "var(--radius)", padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 20 }}>☀</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--accent3)" }}>
                Powered by Sunrise + Wormhole NTT
              </div>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{plan.sunriseNote}</p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
          Prerequisites
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {plan.requirements.map((r, i) => (
            <div key={i} style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", padding: "8px 12px", fontSize: 12, color: "var(--text2)", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: "var(--accent3)" }}>✓</span> {r}
            </div>
          ))}
        </div>
      </div>

      {/* Two-panel: step list + detail */}
      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Step list */}
        <div className="card">
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>
            Migration Steps
          </div>
          {plan.steps.map((s, i) => (
            <div
              key={i}
              onClick={() => setActiveStep(i)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: 12,
                borderRadius: "var(--radius)", cursor: "pointer",
                background: i === activeStep ? "rgba(247,147,26,0.1)" : "transparent",
                border: `1px solid ${i === activeStep ? "var(--accent)" : "transparent"}`,
                marginBottom: 6, transition: "all 0.2s",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: i === activeStep ? "var(--accent)" : "var(--bg3)",
                border: `1px solid ${i === activeStep ? "var(--accent)" : "var(--border2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                color: i === activeStep ? "#000" : "var(--text3)",
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{s.title}</div>
                {s.isOptional && <span className="tag tag-purple" style={{ fontSize: 10 }}>Optional</span>}
                {s.docsLink && (
                  <a href={s.docsLink} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 10, color: "var(--accent2)", fontFamily: "var(--mono)", display: "block", marginTop: 2 }}
                    onClick={(e) => e.stopPropagation()}>
                    docs ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Step detail */}
        <div>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#000", flexShrink: 0 }}>
                {activeStep + 1}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{step.title}</div>
                {step.isOptional && <span className="tag tag-purple" style={{ fontSize: 10 }}>Optional</span>}
              </div>
            </div>

            <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
              {step.description}
            </p>

            {step.warning && (
              <div style={{ background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.3)", borderRadius: "var(--radius)", padding: 12, marginBottom: 16, fontSize: 13, color: "var(--red)" }}>
                ⚠ {step.warning}
              </div>
            )}

            {step.command && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                  Shell commands
                </div>
                <div className="code-block" style={{ position: "relative" }}>
                  <CopyButton text={step.command} />
                  <pre style={{ fontSize: 11 }}>{step.command}</pre>
                </div>
              </div>
            )}

            {step.codeSnippet && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                  Code
                </div>
                <div className="code-block" style={{ position: "relative" }}>
                  <CopyButton text={step.codeSnippet} />
                  <pre style={{ fontSize: 11 }}>{step.codeSnippet}</pre>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="nav-btn" disabled={activeStep === 0} onClick={() => setActiveStep(activeStep - 1)}>← Prev</button>
              <button className="nav-btn primary" disabled={activeStep === plan.steps.length - 1} onClick={() => setActiveStep(activeStep + 1)}>Next →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Full NTT SDK transfer snippet */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🔮</span>
          <div className="card-title">Complete NTT Transfer — TypeScript SDK</div>
          <button
            style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border2)", color: "var(--text2)", fontSize: 12, padding: "6px 14px", borderRadius: "var(--radius)", cursor: "pointer" }}
            onClick={() => setShowTransferCode(!showTransferCode)}
          >
            {showTransferCode ? "Hide" : "Show code"}
          </button>
        </div>
        <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.7, marginBottom: showTransferCode ? 16 : 0 }}>
          Full TypeScript snippet using <code style={{ fontFamily: "var(--mono)", color: "var(--accent2)" }}>@wormhole-foundation/sdk</code> to
          initiate an NTT transfer from EVM to Solana. Uses Testnet — swap{" "}
          <code style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>"Testnet"</code> for{" "}
          <code style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>"Mainnet"</code> when ready.
        </p>
        {showTransferCode && (
          <div className="code-block" style={{ position: "relative" }}>
            <CopyButton text={getNTTSnippet()} />
            <pre style={{ fontSize: 11 }}>{getNTTSnippet()}</pre>
          </div>
        )}
      </div>

      {/* Architecture diagram */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🏗</span>
          <div className="card-title">Migration Architecture</div>
        </div>
        <div className="code-block">
          <pre style={{ color: "var(--text2)", fontSize: 11 }}>{`
  EVM (Ethereum / L2)                        Solana
  ┌──────────────────────────┐               ┌──────────────────────────────────────┐
  │  ERC-20 Contract         │ Wormhole NTT  │  SPL Token Mint                      │
  │  ┌────────────────┐      │ ────────────▶ │  ┌─────────────────┐                 │
  │  │  lock / burn   │      │  VAA + relay  │  │  mint / unlock  │                 │
  │  └────────────────┘      │               │  └────────┬────────┘                 │
  │  NTT Manager             │               │           │                          │
  │  ┌────────────────┐      │               │  ┌────────▼────────┐                 │
  │  │  rate limiter  │      │               │  │  Sunrise DEX    │                 │
  │  │  transceiver   │      │               │  │  liquidity pool │                 │
  │  └────────────────┘      │               │  └─────────────────┘                 │
  └──────────────────────────┘               │                                      │
                                             │  Anchor Program (your dApp)          │
                                             │  ┌──────────────────────────────┐    │
                                             │  │ PDAs · instructions · CPIs   │    │
                                             │  └──────────────────────────────┘    │
                                             └──────────────────────────────────────┘

 `}</pre>
        </div>
      </div>
    </div>
  );
}
