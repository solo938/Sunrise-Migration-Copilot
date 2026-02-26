import { useState } from "react";
import FileUploader from "./components/FileUploader";
import AnalysisDisplay from "./components/AnalysisDisplay";
import MappingSuggestions from "./components/MappingSuggestions";
import AnchorSkeleton from "./components/AnchorSkeleton";
import TokenMigrationGuide from "./components/TokenMigrationGuide";
import CostComparison from "./components/CostComparison";
import ChecklistExport from "./components/ChecklistExport";
import LiveBridgeDemo from "./components/LiveBridgeDemo";
import PerformanceDashboard from "./components/PerformanceDashboard";
import MigrationReport from "./components/MigrationReport";
import { parseSolidity } from "./utils/solidityParser";
import type { ParsedContract } from "./utils/solidityParser";
import { applyMappingRules } from "./utils/mappingRules";
import type { MappingRule } from "./utils/mappingRules";
import { generateAnchorSkeleton } from "./utils/anchorGenerator";
import type { AnchorSkeleton as AnchorSkeletonType } from "./utils/anchorGenerator";
import { estimateCosts } from "./utils/costCalculator";
import type { CostEstimate } from "./utils/costCalculator";

type Step = "upload" | "analysis" | "mapping" | "anchor" | "token" | "bridge" | "cost" | "perf" | "checklist" | "report";

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: "upload",    label: "Upload",      icon: "⬆" },
  { id: "analysis",  label: "Analysis",    icon: "🔍" },
  { id: "mapping",   label: "Mapping",     icon: "🗺" },
  { id: "anchor",    label: "Anchor",      icon: "⚓" },
  { id: "token",     label: "Token Guide", icon: "🌉" },
  { id: "bridge",    label: "Live Bridge", icon: "🚀" },
  { id: "cost",      label: "Cost",        icon: "💰" },
  { id: "perf",      label: "Performance", icon: "⚡" },
  { id: "checklist", label: "Checklist",   icon: "✅" },
  { id: "report",    label: "Report",      icon: "📄" },
];

export default function App() {
  const [activeStep, setActiveStep] = useState<Step>("upload");
  const [contractSource, setContractSource] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedContract | null>(null);
  const [mappings, setMappings] = useState<MappingRule[]>([]);
  const [skeleton, setSkeleton] = useState<AnchorSkeletonType | null>(null);
  const [costs, setCosts] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileLoaded = async (source: string, name: string) => {
    setContractSource(source);
    setFileName(name);
    setError("");
    setLoading(true);
    try {
      const p = parseSolidity(source);
      const m = applyMappingRules(p);
      const s = generateAnchorSkeleton(p);
      const c = estimateCosts(source, p);
      setParsed(p);
      setMappings(m);
      setSkeleton(s);
      setCosts(c);
      setActiveStep("analysis");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to parse contract.");
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">☀</span>
            <div>
              <h1 className="brand-title">Sunrise Migration Copilot</h1>
              <p className="brand-sub">EVM → Solana · Powered by Sunrise &amp; Wormhole NTT</p>
            </div>
          </div>
          {fileName && (
            <div className="file-badge">
              <span className="file-badge-dot" />
              {fileName}
            </div>
          )}
        </div>
      </header>

      {/* Step nav */}
      <nav className="step-nav">
        {STEPS.map((step, i) => {
          const done = i < stepIndex;
          const active = step.id === activeStep;
          const locked = !parsed && i > 0;
          return (
            <button
              key={step.id}
              className={`step-btn ${active ? "active" : ""} ${done ? "done" : ""} ${locked ? "locked" : ""}`}
              onClick={() => !locked && setActiveStep(step.id)}
              disabled={locked}
            >
              <span className="step-icon">{done ? "✓" : step.icon}</span>
              <span className="step-label">{step.label}</span>
              {i < STEPS.length - 1 && <span className="step-connector" />}
            </button>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="main-content">
        {error && (
          <div className="error-banner">
            <span>⚠ {error}</span>
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <p>Parsing contract…</p>
          </div>
        )}

        {!loading && (
          <>
            {activeStep === "upload" && (
              <FileUploader onFileLoaded={handleFileLoaded} />
            )}
            {activeStep === "analysis" && parsed && (
              <AnalysisDisplay parsed={parsed} source={contractSource} />
            )}
            {activeStep === "mapping" && parsed && (
              <MappingSuggestions suggestions={mappings} parsed={parsed} />
            )}
            {activeStep === "anchor" && skeleton && (
              <AnchorSkeleton skeleton={skeleton} />
            )}
            {activeStep === "token" && parsed && (
              <TokenMigrationGuide parsed={parsed} />
            )}
            {activeStep === "bridge" && parsed && (
              <LiveBridgeDemo parsed={parsed} />
            )}
            {activeStep === "cost" && costs && (
              <CostComparison estimate={costs} />
            )}
            {activeStep === "perf" && costs && (
              <PerformanceDashboard estimate={costs} />
            )}
            {activeStep === "checklist" && parsed && (
              <ChecklistExport parsed={parsed} mappings={mappings} skeleton={skeleton} />
            )}
            {activeStep === "report" && parsed && (
              <MigrationReport parsed={parsed} mappings={mappings} skeleton={skeleton} costs={costs} />
            )}
          </>
        )}
      </main>

      {/* Bottom nav */}
      {parsed && (
        <div className="bottom-nav">
          <button
            className="nav-btn"
            disabled={stepIndex === 0}
            onClick={() => setActiveStep(STEPS[stepIndex - 1].id)}
          >
            ← Back
          </button>
          <span className="step-count">{stepIndex + 1} / {STEPS.length}</span>
          <button
            className="nav-btn primary"
            disabled={stepIndex === STEPS.length - 1}
            onClick={() => setActiveStep(STEPS[stepIndex + 1].id)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}