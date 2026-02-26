// PerformanceDashboard.tsx — Cost & Performance Comparison with Recharts charts
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line
} from "recharts";
import type { CostEstimate } from "../utils/costCalculator";

interface Props { estimate: CostEstimate; }

// ── Data ──────────────────────────────────────────────────────────────
const GAS_PRICES = { eth: { low: 15, avg: 35, high: 80 }, l2: { low: 0.5, avg: 1.2, high: 3 } };
const SOL_FEES = { txFee: 0.000005, rentPerByte: 0.00000348, computeUnit: 0.000000000001 };
const ETH_PRICE = 3200;
const SOL_PRICE = 180;

function gweiToUSD(gwei: number, gasUsed: number): number {
  return (gwei * gasUsed * 1e-9 * ETH_PRICE);
}

function computeSolanaRent(bytes: number): number {
  return bytes * SOL_FEES.rentPerByte * SOL_PRICE;
}

const OPS_DATA = [
  {
    op: "Deploy",
    ethereum: gweiToUSD(GAS_PRICES.eth.avg, 1_200_000),
    polygon: gweiToUSD(GAS_PRICES.l2.avg, 1_200_000),
    solana: (0.00144 * SOL_PRICE),
  },
  {
    op: "Transfer",
    ethereum: gweiToUSD(GAS_PRICES.eth.avg, 65_000),
    polygon: gweiToUSD(GAS_PRICES.l2.avg, 65_000),
    solana: (SOL_FEES.txFee * SOL_PRICE),
  },
  {
    op: "Swap",
    ethereum: gweiToUSD(GAS_PRICES.eth.avg, 150_000),
    polygon: gweiToUSD(GAS_PRICES.l2.avg, 150_000),
    solana: (SOL_FEES.txFee * 2 * SOL_PRICE),
  },
  {
    op: "Mint NFT",
    ethereum: gweiToUSD(GAS_PRICES.eth.avg, 200_000),
    polygon: gweiToUSD(GAS_PRICES.l2.avg, 200_000),
    solana: (0.012 * SOL_PRICE),
  },
  {
    op: "Batch 100",
    ethereum: gweiToUSD(GAS_PRICES.eth.avg, 65_000) * 100,
    polygon: gweiToUSD(GAS_PRICES.l2.avg, 65_000) * 100,
    solana: (SOL_FEES.txFee * 100 * SOL_PRICE),
  },
];

const TPS_DATA = [
  { name: "Bitcoin",  tps: 7,     finality: 3600,  cost: 8.5  },
  { name: "Ethereum", tps: 15,    finality: 780,   cost: gweiToUSD(35, 65000) },
  { name: "Polygon",  tps: 7000,  finality: 120,   cost: gweiToUSD(1.2, 65000) },
  { name: "Arbitrum", tps: 4000,  finality: 60,    cost: gweiToUSD(0.8, 65000) },
  { name: "Solana",   tps: 65000, finality: 0.4,   cost: SOL_FEES.txFee * SOL_PRICE },
];

const RADAR_DATA = [
  { metric: "Throughput",   ethereum: 15,  solana: 100 },
  { metric: "Cost",         ethereum: 8,   solana: 100 },
  { metric: "Finality",     ethereum: 10,  solana: 100 },
  { metric: "Dev Tools",    ethereum: 95,  solana: 75  },
  { metric: "Ecosystem",    ethereum: 100, solana: 72  },
  { metric: "Composability",ethereum: 88,  solana: 80  },
];

const MONTHLY_DATA = Array.from({length:12},(_,i)=>({
  month:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  eth_gas: 20 + Math.sin(i/2)*15 + Math.random()*10,
  sol_fee: 0.001 + Math.random()*0.0005,
}));

// ── Custom tooltip ────────────────────────────────────────────────────
const CustomTooltip = ({active,payload,label,prefix="$",decimals=4}:any) => {
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:8,padding:"10px 14px",fontSize:12,fontFamily:"var(--mono)"}}>
      <div style={{fontWeight:700,marginBottom:6,color:"var(--text)"}}>{label}</div>
      {payload.map((p:any)=>(
        <div key={p.name} style={{color:p.color,marginBottom:3}}>
          {p.name}: {prefix}{typeof p.value==="number"?p.value.toFixed(decimals):p.value}
        </div>
      ))}
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────
export default function PerformanceDashboard({estimate}:Props){
  const [activeTab,setActiveTab]=useState<"cost"|"performance"|"radar"|"history">("cost");
  const savingsUSD = estimate.savingsUSD;
  const savingsPct = Math.round(estimate.savingsPercent);

  const tabs = [
    {id:"cost",       label:"💰 Cost Compare"},
    {id:"performance",label:"⚡ TPS & Speed"},
    {id:"radar",      label:"🎯 Capability Radar"},
    {id:"history",    label:"📈 Gas History"},
  ];

  return(
    <div>
      {/* Hero stats */}
      <div className="grid-3" style={{marginBottom:24}}>
        <div className="card" style={{background:"linear-gradient(135deg,rgba(25,251,155,0.1),rgba(25,251,155,0.03))",border:"1px solid rgba(25,251,155,0.3)",textAlign:"center"}}>
          <div style={{fontSize:13,color:"var(--text3)",fontFamily:"var(--mono)",marginBottom:6}}>Estimated Savings</div>
          <div style={{fontSize:36,fontWeight:900,color:"var(--accent3)",fontFamily:"var(--mono)"}}>
            ${savingsUSD.toFixed(2)}
          </div>
          <div style={{fontSize:12,color:"var(--accent3)",marginTop:4}}>{savingsPct}% cheaper on Solana</div>
        </div>
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:13,color:"var(--text3)",fontFamily:"var(--mono)",marginBottom:6}}>Solana Throughput</div>
          <div style={{fontSize:36,fontWeight:900,color:"var(--accent2)",fontFamily:"var(--mono)"}}>65K</div>
          <div style={{fontSize:12,color:"var(--text2)",marginTop:4}}>TPS vs Ethereum's 15</div>
        </div>
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:13,color:"var(--text3)",fontFamily:"var(--mono)",marginBottom:6}}>Finality Time</div>
          <div style={{fontSize:36,fontWeight:900,color:"var(--accent)",fontFamily:"var(--mono)"}}>400ms</div>
          <div style={{fontSize:12,color:"var(--text2)",marginTop:4}}>vs Ethereum's 13 min</div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{display:"flex",gap:4,marginBottom:16,background:"var(--bg3)",borderRadius:"var(--radius)",padding:4}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id as any)} style={{flex:1,padding:"10px 8px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,transition:"all .2s",background:activeTab===t.id?"var(--bg)":"transparent",color:activeTab===t.id?"var(--accent)":"var(--text3)",boxShadow:activeTab===t.id?"0 1px 4px rgba(0,0,0,0.3)":"none"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Cost Compare */}
      {activeTab==="cost"&&(
        <div>
          <div className="card">
            <div className="card-header"><span className="card-icon">💰</span><div className="card-title">Gas Cost by Operation (USD)</div><div className="card-subtitle">Based on avg gas prices: ETH 35 gwei, Matic 1.2 gwei</div></div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={OPS_DATA} margin={{top:10,right:10,left:0,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="op" tick={{fill:"var(--text3)",fontSize:11,fontFamily:"monospace"}} />
                <YAxis tickFormatter={v=>v>=1?`$${v.toFixed(0)}`:`$${v.toFixed(3)}`} tick={{fill:"var(--text3)",fontSize:10,fontFamily:"monospace"}} />
                <Tooltip content={<CustomTooltip prefix="$" decimals={4}/>} />
                <Legend wrapperStyle={{fontSize:11,fontFamily:"monospace"}} />
                <Bar dataKey="ethereum" name="Ethereum" fill="#627EEA" radius={[4,4,0,0]} />
                <Bar dataKey="polygon"  name="Polygon"  fill="#9945FF" radius={[4,4,0,0]} />
                <Bar dataKey="solana"   name="Solana"   fill="var(--accent3)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Side-by-side breakdown */}
          <div className="grid-2">
            <div className="card">
              <div className="card-header"><span style={{fontSize:20}}>⟠</span><div className="card-title">Ethereum Costs</div></div>
              {[
                {label:"Deploy contract",   cost:gweiToUSD(35,1_200_000), unit:"~1.2M gas"},
                {label:"Token transfer",    cost:gweiToUSD(35,65_000),    unit:"~65K gas"},
                {label:"DEX swap",          cost:gweiToUSD(35,150_000),   unit:"~150K gas"},
                {label:"Storage (32 bytes)",cost:gweiToUSD(35,20_000),    unit:"~20K gas / slot"},
              ].map(row=>(
                <div key={row.label} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
                  <div><div style={{fontWeight:600}}>{row.label}</div><div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",marginTop:2}}>{row.unit}</div></div>
                  <div style={{fontWeight:800,color:"var(--red)",fontFamily:"var(--mono)",fontSize:15}}>${row.cost.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{border:"1px solid rgba(25,251,155,0.25)"}}>
              <div className="card-header"><span style={{fontSize:20}}>◎</span><div className="card-title">Solana Costs</div></div>
              {[
                {label:"Deploy program",    cost:0.00144*SOL_PRICE, unit:"~1.4M lamports"},
                {label:"Token transfer",    cost:SOL_FEES.txFee*SOL_PRICE, unit:"5K lamports"},
                {label:"SPL swap",          cost:SOL_FEES.txFee*2*SOL_PRICE, unit:"~10K lamports"},
                {label:"Account rent (1KB)",cost:computeSolanaRent(1024), unit:"~3.5M lamports/yr"},
              ].map(row=>(
                <div key={row.label} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
                  <div><div style={{fontWeight:600}}>{row.label}</div><div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",marginTop:2}}>{row.unit}</div></div>
                  <div style={{fontWeight:800,color:"var(--accent3)",fontFamily:"var(--mono)",fontSize:15}}>${row.cost.toFixed(4)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TPS / Performance */}
      {activeTab==="performance"&&(
        <div>
          <div className="card">
            <div className="card-header"><span className="card-icon">⚡</span><div className="card-title">Throughput Comparison (TPS)</div></div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={TPS_DATA} layout="vertical" margin={{top:10,right:40,left:40,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{fill:"var(--text3)",fontSize:10,fontFamily:"monospace"}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`} />
                <YAxis dataKey="name" type="category" tick={{fill:"var(--text2)",fontSize:12,fontFamily:"monospace"}} />
                <Tooltip content={<CustomTooltip prefix="" decimals={0}/>} />
                <Bar dataKey="tps" name="TPS" radius={[0,4,4,0]} fill="var(--accent)">
                  {TPS_DATA.map((_,i)=>(
                    <rect key={i} fill={TPS_DATA[i].name==="Solana"?"var(--accent3)":"var(--accent)"}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header"><span className="card-icon">⏱</span><div className="card-title">Finality Time (seconds)</div></div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"var(--mono)",fontSize:12}}>
                  <thead><tr style={{borderBottom:"1px solid var(--border)"}}>
                    <th style={{padding:"8px 12px",textAlign:"left",color:"var(--text3)",fontSize:10,textTransform:"uppercase"}}>Chain</th>
                    <th style={{padding:"8px 12px",textAlign:"right",color:"var(--text3)",fontSize:10,textTransform:"uppercase"}}>Finality</th>
                    <th style={{padding:"8px 12px",textAlign:"right",color:"var(--text3)",fontSize:10,textTransform:"uppercase"}}>Tx Cost</th>
                  </tr></thead>
                  <tbody>
                    {TPS_DATA.map(r=>(
                      <tr key={r.name} style={{borderBottom:"1px solid var(--border)"}}>
                        <td style={{padding:"10px 12px",fontWeight:r.name==="Solana"?800:400,color:r.name==="Solana"?"var(--accent3)":"var(--text)"}}>{r.name}</td>
                        <td style={{padding:"10px 12px",textAlign:"right",color:r.finality<1?"var(--accent3)":r.finality<100?"var(--yellow)":"var(--red)"}}>
                          {r.finality<1?`${r.finality*1000}ms`:r.finality>=60?`${Math.round(r.finality/60)}min`:`${r.finality}s`}
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"right",color:"var(--text2)"}}>
                          {r.cost<0.001?`$${r.cost.toFixed(6)}`:`$${r.cost.toFixed(3)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{border:"1px solid rgba(247,147,26,0.3)",background:"rgba(247,147,26,0.04)"}}>
              <div className="card-header"><span style={{fontSize:20}}>☀</span><div className="card-title" style={{color:"var(--accent)"}}>Sunrise + Solana Advantage</div></div>
              {[
                {icon:"⚡",title:"65,000 TPS",        desc:"Process entire DeFi workloads without congestion"},
                {icon:"💸",title:"$0.00009 avg tx",   desc:"Users pay fractions of a cent for any operation"},
                {icon:"⏱",title:"400ms finality",     desc:"Sub-second settlement for trading & payments"},
                {icon:"☀",title:"Sunrise liquidity",  desc:"Day-one AMM pools — no cold-start problem post-migration"},
                {icon:"🌉",title:"Wormhole NTT",       desc:"Native token standard — full supply control across chains"},
              ].map(f=>(
                <div key={f.title} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{fontSize:18,flexShrink:0}}>{f.icon}</span>
                  <div><div style={{fontWeight:700,fontSize:13}}>{f.title}</div><div style={{fontSize:12,color:"var(--text2)",lineHeight:1.5}}>{f.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Radar */}
      {activeTab==="radar"&&(
        <div className="card">
          <div className="card-header"><span className="card-icon">🎯</span><div className="card-title">Ecosystem Capability Radar</div><div className="card-subtitle">Normalized scores — higher = better</div></div>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={RADAR_DATA} margin={{top:20,right:40,bottom:20,left:40}}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{fill:"var(--text2)",fontSize:12,fontFamily:"monospace"}} />
              <Radar name="Ethereum" dataKey="ethereum" stroke="#627EEA" fill="#627EEA" fillOpacity={0.2} />
              <Radar name="Solana"   dataKey="solana"   stroke="var(--accent3)" fill="var(--accent3)" fillOpacity={0.25} />
              <Legend wrapperStyle={{fontSize:12,fontFamily:"monospace"}} />
              <Tooltip content={<CustomTooltip prefix="" decimals={0}/>} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid-2">
            {[
              {metric:"Throughput",   eth:"15 TPS",   sol:"65,000 TPS",  winner:"sol"},
              {metric:"Avg Tx Cost",  eth:"$1–$50",   sol:"<$0.001",     winner:"sol"},
              {metric:"Finality",     eth:"13 min",   sol:"400ms",       winner:"sol"},
              {metric:"Dev Tooling",  eth:"Excellent", sol:"Good",       winner:"eth"},
              {metric:"Ecosystem",    eth:"Largest",  sol:"Growing",     winner:"eth"},
              {metric:"Composability",eth:"DeFi-native",sol:"Parallel",  winner:"draw"},
            ].map(r=>(
              <div key={r.metric} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{flex:1,fontSize:12,fontWeight:700}}>{r.metric}</div>
                <div style={{flex:1,fontSize:12,fontFamily:"var(--mono)",color:r.winner==="eth"?"#627EEA":"var(--text2)",textAlign:"center"}}>{r.eth}</div>
                <div style={{flex:1,fontSize:12,fontFamily:"var(--mono)",color:r.winner==="sol"?"var(--accent3)":"var(--text2)",textAlign:"center"}}>{r.sol}</div>
                <div style={{fontSize:14}}>{r.winner==="sol"?"◎":r.winner==="eth"?"⟠":"="}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gas history */}
      {activeTab==="history"&&(
        <div className="card">
          <div className="card-header"><span className="card-icon">📈</span><div className="card-title">Gas Fee Trends (2024 avg, USD/transfer)</div></div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={MONTHLY_DATA} margin={{top:10,right:10,left:0,bottom:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{fill:"var(--text3)",fontSize:11,fontFamily:"monospace"}} />
              <YAxis yAxisId="eth" orientation="left" tickFormatter={v=>`$${v.toFixed(0)}`} tick={{fill:"#627EEA",fontSize:10,fontFamily:"monospace"}} />
              <YAxis yAxisId="sol" orientation="right" tickFormatter={v=>`$${v.toFixed(4)}`} tick={{fill:"var(--accent3)",fontSize:10,fontFamily:"monospace"}} />
              <Tooltip content={<CustomTooltip prefix="$" decimals={4}/>} />
              <Legend wrapperStyle={{fontSize:11,fontFamily:"monospace"}} />
              <Line yAxisId="eth" type="monotone" dataKey="eth_gas" name="Ethereum gas" stroke="#627EEA" strokeWidth={2} dot={false} />
              <Line yAxisId="sol" type="monotone" dataKey="sol_fee" name="Solana fee"   stroke="var(--accent3)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{background:"var(--bg3)",borderRadius:"var(--radius)",padding:14,marginTop:16,fontSize:13,color:"var(--text2)",lineHeight:1.7}}>
            ⚠ Values are illustrative estimates based on historical averages. Ethereum gas fluctuates significantly with network demand. Solana fees are protocol-fixed at 5,000 lamports (~$0.00009) per signature.
          </div>
        </div>
      )}
    </div>
  );
}