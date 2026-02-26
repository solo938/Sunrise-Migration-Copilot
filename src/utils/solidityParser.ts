// solidityParser.ts
// Uses @solidity-parser/parser to extract structured info from .sol source

export interface StateVariable {
    name: string;
    typeName: string;
    visibility: string;
    constant: boolean;
    immutable: boolean;
  }
  
  export interface FunctionDef {
    name: string;
    visibility: string;
    stateMutability: string;
    parameters: { name: string; typeName: string }[];
    returnParameters: { name: string; typeName: string }[];
    isConstructor: boolean;
    isModifier: boolean;
  }
  
  export interface EventDef {
    name: string;
    parameters: { name: string; typeName: string; indexed: boolean }[];
  }
  
  export interface ContractDef {
    name: string;
    kind: "contract" | "interface" | "library";
    baseContracts: string[];
    stateVariables: StateVariable[];
    functions: FunctionDef[];
    events: EventDef[];
  }
  
  export interface ParsedContract {
    contracts: ContractDef[];
    pragmaVersion: string;
    imports: string[];
    isERC20: boolean;
    isERC721: boolean;
    hasOwnable: boolean;
    hasAccessControl: boolean;
    hasMappings: boolean;
    hasEvents: boolean;
    complexity: "low" | "medium" | "high";
    lineCount: number;
    errors: string[];
  }
  
  // ── type name helpers ──────────────────────────────────────────────────
  function getTypeName(typeNode: any): string {
    if (!typeNode) return "unknown";
    if (typeNode.type === "ElementaryTypeName") return typeNode.name;
    if (typeNode.type === "UserDefinedTypeName") return typeNode.namePath;
    if (typeNode.type === "ArrayTypeName") return `${getTypeName(typeNode.baseTypeName)}[]`;
    if (typeNode.type === "Mapping") {
      return `mapping(${getTypeName(typeNode.keyType)} => ${getTypeName(typeNode.valueType)})`;
    }
    return typeNode.name || "unknown";
  }
  
  function getParams(params: any[] = []): { name: string; typeName: string }[] {
    return params.map((p) => ({ name: p.name || "", typeName: getTypeName(p.typeName) }));
  }
  
  // ── main parser ────────────────────────────────────────────────────────
  export function parseSolidity(source: string): ParsedContract {
    const errors: string[] = [];
    const contracts: ContractDef[] = [];
    let pragmaVersion = "unknown";
    const imports: string[] = [];
  
    // Try to use @solidity-parser/parser if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parser: any = null;
    try {
      // Dynamic require — works if installed; if not, fall back to regex
      // @ts-ignore
      parser = (window as any).__solidityParser || null;
    } catch (_) { /* no-op */ }
  
    if (!parser) {
      // Regex fallback — good enough for MVP
      return regexFallbackParser(source);
    }
  
    try {
      const ast = parser.parse(source, { tolerant: true, loc: true, range: true });
  
      // Pragma
      const pragma = ast.children?.find((n: any) => n.type === "PragmaDirective");
      if (pragma) pragmaVersion = pragma.value || "unknown";
  
      // Imports
      ast.children
        ?.filter((n: any) => n.type === "ImportDirective")
        .forEach((n: any) => imports.push(n.path));
  
      // Contracts
      ast.children
        ?.filter((n: any) => ["ContractDefinition"].includes(n.type))
        .forEach((c: any) => {
          const stateVariables: StateVariable[] = [];
          const functions: FunctionDef[] = [];
          const events: EventDef[] = [];
  
          c.subNodes?.forEach((node: any) => {
            if (node.type === "StateVariableDeclaration") {
              node.variables?.forEach((v: any) => {
                stateVariables.push({
                  name: v.name,
                  typeName: getTypeName(v.typeName),
                  visibility: v.visibility || "internal",
                  constant: !!v.isDeclaredConst,
                  immutable: !!v.isImmutable,
                });
              });
            } else if (node.type === "FunctionDefinition") {
              functions.push({
                name: node.name || (node.isConstructor ? "constructor" : "fallback"),
                visibility: node.visibility || "public",
                stateMutability: node.stateMutability || "nonpayable",
                parameters: getParams(node.parameters?.parameters),
                returnParameters: getParams(node.returnParameters?.parameters),
                isConstructor: !!node.isConstructor,
                isModifier: node.type === "ModifierDefinition",
              });
            } else if (node.type === "EventDefinition") {
              events.push({
                name: node.name,
                parameters: (node.parameters?.parameters || []).map((p: any) => ({
                  name: p.name || "",
                  typeName: getTypeName(p.typeName),
                  indexed: !!p.isIndexed,
                })),
              });
            }
          });
  
          contracts.push({
            name: c.name,
            kind: c.kind || "contract",
            baseContracts: c.baseContracts?.map((b: any) => b.baseName?.namePath || "") || [],
            stateVariables,
            functions,
            events,
          });
        });
    } catch (e: any) {
      errors.push(`AST parse error: ${e.message}`);
      return regexFallbackParser(source);
    }
  
    return buildResult(contracts, pragmaVersion, imports, source, errors);
  }
  
  // ── regex fallback ─────────────────────────────────────────────────────
  function regexFallbackParser(source: string): ParsedContract {
    const contracts: ContractDef[] = [];
    const errors: string[] = [];
  
    // Pragma
    const pragmaMatch = source.match(/pragma\s+solidity\s+([^;]+);/);
    const pragmaVersion = pragmaMatch ? pragmaMatch[1].trim() : "unknown";
  
    // Imports
    const importMatches = [...source.matchAll(/import\s+["']([^"']+)["']/g)];
    const imports = importMatches.map((m) => m[1]);
  
    // Contracts
    const contractMatches = [
      ...source.matchAll(
        /(?:^|\n)\s*(contract|interface|library)\s+(\w+)(?:\s+is\s+([\w\s,]+))?\s*\{/gm
      ),
    ];
  
    for (const match of contractMatches) {
      const kind = match[1] as "contract" | "interface" | "library";
      const name = match[2];
      const bases = match[3]
        ? match[3].split(",").map((s) => s.trim()).filter(Boolean)
        : [];
  
      // Extract body heuristically
      const startIdx = match.index! + match[0].length;
      let depth = 1;
      let i = startIdx;
      while (i < source.length && depth > 0) {
        if (source[i] === "{") depth++;
        else if (source[i] === "}") depth--;
        i++;
      }
      const body = source.slice(startIdx, i - 1);
  
      // State variables
      const varMatches = [
        ...body.matchAll(
          /(?:^|\n)\s*((?:mapping|address|uint\d*|int\d*|bool|bytes\d*|string|[\w.]+)(?:\[\])?)\s+(?:public\s+|private\s+|internal\s+|constant\s+|immutable\s+)*(\w+)\s*[;=]/gm
        ),
      ];
      const stateVariables: StateVariable[] = varMatches.map((v) => ({
        name: v[2],
        typeName: v[1],
        visibility: body.match(new RegExp(`${v[1]}[^;]*\\b(public|private|internal)\\b`))
          ?.[1] || "internal",
        constant: body.includes(`${v[1]} constant`) || body.includes(`constant ${v[1]}`),
        immutable: body.includes(`${v[1]} immutable`) || body.includes(`immutable ${v[1]}`),
      }));
  
      // Functions
      const fnMatches = [
        ...body.matchAll(
          /function\s+(\w+)\s*\(([^)]*)\)\s*(?:public|private|internal|external)?[^{]*/gm
        ),
      ];
      const functions: FunctionDef[] = fnMatches.map((f) => {
        const visibility =
          f[0].match(/\b(public|private|internal|external)\b/)?.[1] || "public";
        const mutability =
          f[0].match(/\b(pure|view|payable)\b/)?.[1] || "nonpayable";
        const params = f[2]
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => {
            const parts = p.split(/\s+/);
            return { typeName: parts[0] || "unknown", name: parts[parts.length - 1] || "" };
          });
        return {
          name: f[1],
          visibility,
          stateMutability: mutability,
          parameters: params,
          returnParameters: [],
          isConstructor: false,
          isModifier: false,
        };
      });
  
      // Events
      const evtMatches = [...body.matchAll(/event\s+(\w+)\s*\(([^)]*)\)/gm)];
      const events: EventDef[] = evtMatches.map((e) => ({
        name: e[1],
        parameters: e[2]
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => {
            const parts = p.split(/\s+/);
            return {
              typeName: parts[0] || "unknown",
              name: parts[parts.length - 1] || "",
              indexed: p.includes("indexed"),
            };
          }),
      }));
  
      // Constructor
      const ctorMatch = body.match(/constructor\s*\(([^)]*)\)/);
      if (ctorMatch) {
        functions.unshift({
          name: "constructor",
          visibility: "public",
          stateMutability: "nonpayable",
          parameters: ctorMatch[1]
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p) => {
              const parts = p.split(/\s+/);
              return { typeName: parts[0] || "unknown", name: parts[parts.length - 1] || "" };
            }),
          returnParameters: [],
          isConstructor: true,
          isModifier: false,
        });
      }
  
      contracts.push({ name, kind, baseContracts: bases, stateVariables, functions, events });
    }
  
    return buildResult(contracts, pragmaVersion, imports, source, errors);
  }
  
  // ── build final result ────────────────────────────────────────────────
  function buildResult(
    contracts: ContractDef[],
    pragmaVersion: string,
    imports: string[],
    source: string,
    errors: string[]
  ): ParsedContract {
    const allBases = contracts.flatMap((c) => c.baseContracts.map((b) => b.toLowerCase()));
    const allFns = contracts.flatMap((c) => c.functions.map((f) => f.name.toLowerCase()));
    const srcLower = source.toLowerCase();
  
    const isERC20 =
      allFns.includes("transfer") &&
      allFns.includes("approve") &&
      allFns.includes("transferfrom");
    const isERC721 =
      allFns.includes("safetransferfrom") || srcLower.includes("erc721");
    const hasOwnable =
      allBases.some((b) => b.includes("ownable")) || srcLower.includes("ownable");
    const hasAccessControl = srcLower.includes("accesscontrol") || srcLower.includes("roles");
    const hasMappings = source.includes("mapping(");
    const hasEvents = contracts.some((c) => c.events.length > 0);
  
    const totalFns = contracts.reduce((s, c) => s + c.functions.length, 0);
    const totalVars = contracts.reduce((s, c) => s + c.stateVariables.length, 0);
    const complexity: "low" | "medium" | "high" =
      totalFns > 15 || totalVars > 10 ? "high" : totalFns > 6 ? "medium" : "low";
  
    return {
      contracts,
      pragmaVersion,
      imports,
      isERC20,
      isERC721,
      hasOwnable,
      hasAccessControl,
      hasMappings,
      hasEvents,
      complexity,
      lineCount: source.split("\n").length,
      errors,
    };
  }