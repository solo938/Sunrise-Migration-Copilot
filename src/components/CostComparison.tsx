import type { CostEstimate } from "../utils/costCalculator";

interface Props {
  estimate: CostEstimate;
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="progress-bar-wrap" style={{ margin: "8px 0" }}>
      <div
        className="progress-bar-fill"
        style={{
          width: `${Math.min((value / max) * 100, 100)}%`,
          background: color,
        }}
      />
    </div>
  );
}

export default function CostComparison({ estimate }: Props) {
  const { ethereum, solana, savingsPercent, savingsUSD, comparison, assumptions } = estimate;

  return (
    <div>
      {/* Hero comparison */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">💰</span>
          <div className="card-title">Deployment Cost Comparison</div>
          <div className="card-subtitle" style={{ marginTop: 2 }}>Based on static analysis of your contract</div>
        </div>

        <div className="cost-vs">
          {/* Ethereum */}
          <div className="cost-panel ethereum">
            <div className="cost-chain">⟠ Ethereum</div>
            <div className="cost-amount cost-eth">${ethereum.deploymentCost.toLocaleString()}</div>
            <div className="cost-usd">{ethereum.deploymentNative}</div>
            <div style={{ marginTop: 12, fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
              {ethereum.deploymentGas?.toLocaleString()} gas
            </div>
          </div>

          {/* Divider */}
          <div className="cost-vs-divider">
            <div className="cost-vs-label">vs</div>
            <div className="savings-badge">
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>YOU SAVE</div>
              <div>{savingsPercent}%</div>
              <div style={{ fontSize: 12 }}>${savingsUSD.toLocaleString()}</div>
            </div>
          </div>

          {/* Solana */}
          <div className="cost-panel solana">
            <div className="cost-chain">◎ Solana</div>
            <div className="cost-amount cost-sol">${solana.deploymentCost.toLocaleString()}</div>
            <div className="cost-usd">{solana.deploymentNative}</div>
            <div style={{ marginTop: 12, fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
              + refundable rent deposit
            </div>
          </div>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="grid-2">
        {/* Ethereum detail */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: 20 }}>⟠</span>
            <div className="card-title">Ethereum Breakdown</div>
          </div>
          {comparison.map((item) => (
            <div key={item.label} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>{item.label}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#627EEA", fontWeight: 700 }}>
                  {item.ethUSD !== undefined ? `$${item.ethUSD.toLocaleString()}` : "—"}
                </span>
              </div>
              {item.ethValue && (
                <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)" }}>
                  {item.ethValue}
                </div>
              )}
              {item.ethUSD !== undefined && (
                <Bar value={item.ethUSD} max={Math.max(item.ethUSD, item.solUSD ?? 0, 1)} color="#627EEA" />
              )}
            </div>
          ))}

          <div style={{ marginTop: 16, padding: 12, background: "rgba(98,126,234,0.08)", borderRadius: "var(--radius)", border: "1px solid rgba(98,126,234,0.2)" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Est. Annual Cost (1k txs)</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 800, color: "#627EEA" }}>
              ${ethereum.annualMaintenanceUSD.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Solana detail */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: 20 }}>◎</span>
            <div className="card-title">Solana Breakdown</div>
          </div>
          {comparison.map((item) => (
            <div key={item.label} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>{item.label}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent2)", fontWeight: 700 }}>
                  {item.solUSD !== undefined ? `$${item.solUSD.toLocaleString()}` : "—"}
                </span>
              </div>
              {item.solValue && (
                <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)" }}>
                  {item.solValue}
                </div>
              )}
              {item.solUSD !== undefined && (
                <Bar value={item.solUSD} max={Math.max(item.ethUSD ?? 0, item.solUSD, 1)} color="var(--accent2)" />
              )}
            </div>
          ))}

          <div style={{ marginTop: 16, padding: 12, background: "rgba(153,69,255,0.08)", borderRadius: "var(--radius)", border: "1px solid rgba(153,69,255,0.2)" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Est. Annual Cost (1k txs)</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 800, color: "var(--accent2)" }}>
              ${solana.annualMaintenanceUSD.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Per-tx stats */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">⚡</span>
          <div className="card-title">Per-Transaction Cost</div>
        </div>
        <div className="grid-3">
          <div className="stat-box">
            <div className="stat-label">Ethereum avg tx</div>
            <div className="stat-value" style={{ color: "#627EEA", fontSize: 20 }}>
              ${ethereum.perTxCost}
            </div>
            <div className="stat-desc">{ethereum.perTxNative}</div>
          </div>
          <div className="stat-box" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent3)" }}>
              {Math.round(ethereum.perTxCost / (solana.perTxCost || 0.00001))}×
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center" }}>
              cheaper on Solana
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Solana avg tx</div>
            <div className="stat-value" style={{ color: "var(--accent2)", fontSize: 20 }}>
              ${solana.perTxCost.toFixed(5)}
            </div>
            <div className="stat-desc">{solana.perTxNative}</div>
          </div>
        </div>
      </div>

      {/* Ethereum detail table */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🔬</span>
          <div className="card-title">Ethereum Analysis Details</div>
        </div>
        {ethereum.details.map((d) => (
          <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
            <span style={{ color: "var(--text2)" }}>{d.label}</span>
            <span style={{ fontFamily: "var(--mono)", color: "#627EEA" }}>{d.ethValue}</span>
          </div>
        ))}
      </div>

      {/* Solana detail table */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🔬</span>
          <div className="card-title">Solana Analysis Details</div>
        </div>
        {solana.details.map((d) => (
          <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
            <span style={{ color: "var(--text2)" }}>{d.label}</span>
            <span style={{ fontFamily: "var(--mono)", color: "var(--accent2)" }}>{d.solValue}</span>
          </div>
        ))}

        <div style={{ marginTop: 16, padding: 12, background: "rgba(25,251,155,0.06)", borderRadius: "var(--radius)", border: "1px solid rgba(25,251,155,0.2)" }}>
          <div style={{ fontSize: 12, color: "var(--accent3)", fontWeight: 700, marginBottom: 6 }}>
            ☀ Rent is refundable
          </div>
          <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
            Unlike Ethereum's permanent gas costs, Solana's rent-exemption deposit is refundable when
            an account is closed. If you no longer need a PDA or token account, you can recover the SOL.
          </p>
        </div>
      </div>

      {/* Assumptions */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">📎</span>
          <div className="card-title">Assumptions &amp; Methodology</div>
        </div>
        {assumptions.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 12, color: "var(--text2)", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text3)" }}>·</span> {a}
          </div>
        ))}
        <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 12, fontStyle: "italic" }}>
          All figures are estimates based on static code analysis and market averages. Actual costs
          depend on network conditions, contract optimization, and compute unit usage.
        </p>
      </div>
    </div>
  );
}