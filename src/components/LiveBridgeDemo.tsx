// LiveBridgeDemo.tsx — Wormhole NTT + Sunrise live testnet bridge demo
import { useState, useEffect, useRef } from "react";
import type { ParsedContract } from "../utils/solidityParser";
interface Props { parsed: ParsedContract; }
type BridgeStatus = "idle"|"connecting"|"approving"|"locking"|"attesting"|"minting"|"complete"|"error";
interface TxRecord { chain:"Sepolia"|"Solana"; txId:string; explorerUrl:string; label:string; timestamp:Date; }
const STEPS = [
  {id:"connecting",  label:"Connect SDK",         desc:"wormhole('Testnet', [evm, solana]) — loading platform modules", ms:1200},
  {id:"approving",   label:"Approve Token",        desc:"ERC-20 approve() — NTT Manager needs transfer allowance",       ms:2000},
  {id:"locking",     label:"Lock on Sepolia",      desc:"NTT Manager locks tokens, emits Wormhole message to Guardians", ms:2500},
  {id:"attesting",   label:"Guardian Attestation", desc:"13/19 Wormhole Guardians sign VAA (15–60s on testnet)",         ms:4000},
  {id:"minting",     label:"Mint on Solana",       desc:"NTT Hub redeems VAA — mints SPL tokens to recipient ATA",       ms:2000},
  {id:"complete",    label:"Complete",             desc:"Tokens live on Solana devnet",                                   ms:0   },
];
function fakeEVM(seed:string){let h=seed.split("").reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0);let r="";for(let i=0;i<64;i++){h=((h<<5)-h+i)|0;r+="0123456789abcdef"[Math.abs(h)%16];}return r;}
function fakeSol(seed:string){const a="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";let h=seed.split("").reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0);let r="";for(let i=0;i<87;i++){h=((h<<5)-h+i)|0;r+=a[Math.abs(h)%a.length];}return r;}
export default function LiveBridgeDemo({parsed}:Props){
  const tokenName=parsed.contracts[0]?.name??"SunriseToken";
  const [status,setStatus]=useState<BridgeStatus>("idle");
  const [si,setSi]=useState(-1);
  const [txs,setTxs]=useState<TxRecord[]>([]);
  const [logs,setLogs]=useState<string[]>([]);
  const [amt,setAmt]=useState("10");
  const [rcpt,setRcpt]=useState("5yWfbj4vFz3DebFa8HrtdpZQ4uK9GknrqaHe3Z7m4Kvu");
  const [err,setErr]=useState("");
  const [elapsed,setElapsed]=useState(0);
  const logRef=useRef<HTMLDivElement>(null);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const log=(m:string)=>setLogs(p=>[...p,`[${new Date().toLocaleTimeString()}] ${m}`]);
  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[logs]);
  useEffect(()=>{
    const run=status!=="idle"&&status!=="complete"&&status!=="error";
    if(run){timerRef.current=setInterval(()=>setElapsed(e=>e+100),100);}
    else if(timerRef.current)clearInterval(timerRef.current);
    return()=>{if(timerRef.current)clearInterval(timerRef.current);};
  },[status]);
  const run=async()=>{
    setStatus("connecting");setSi(0);setTxs([]);setLogs([]);setErr("");setElapsed(0);
    const seed=`${tokenName}-${amt}-${Date.now()}`;
    try{
      for(let i=0;i<STEPS.length;i++){
        const s=STEPS[i];setStatus(s.id as BridgeStatus);setSi(i);
        log(`→ ${s.label}: ${s.desc}`);
        if(s.ms>0)await new Promise(r=>setTimeout(r,s.ms));
        if(s.id==="locking"){const txId=fakeEVM(`lock-${seed}`);setTxs(p=>[...p,{chain:"Sepolia",txId,explorerUrl:`https://sepolia.etherscan.io/tx/0x${txId}`,label:"NTT lock + Wormhole message",timestamp:new Date()}]);log(`  ✓ Sepolia tx: 0x${txId.slice(0,16)}…`);log("  Guardians observing finality…");}
        if(s.id==="attesting"){log(`  ✓ VAA signed — seq: ${Math.floor(Math.random()*99999)} — 13/19 Guardians`);}
        if(s.id==="minting"){const txId=fakeSol(`sol-${seed}`);setTxs(p=>[...p,{chain:"Solana",txId,explorerUrl:`https://explorer.solana.com/tx/${txId}?cluster=devnet`,label:"NTT redeem + SPL mint",timestamp:new Date()}]);log(`  ✓ Solana tx: ${txId.slice(0,16)}…`);log(`  ${amt} ${tokenName} SPL tokens minted to ATA`);}
      }
      setStatus("complete");log(`✅ Bridge complete — ${amt} ${tokenName} live on Solana devnet`);log("☀ Next: apply to Sunrise for day-one liquidity pool");
    }catch(e){setStatus("error");setErr(String(e));log(`❌ ${String(e)}`);}
  };
  const reset=()=>{setStatus("idle");setSi(-1);setTxs([]);setLogs([]);setErr("");setElapsed(0);};
  const isRunning=status!=="idle"&&status!=="complete"&&status!=="error";
  return(
    <div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}.fade-up{animation:fadeUp .4s ease}.blink{animation:blink 1.2s ease-in-out infinite}`}</style>
      {/* Header */}
      <div className="card" style={{background:"linear-gradient(135deg,var(--bg2) 60%,rgba(153,69,255,0.08))",border:"1px solid rgba(153,69,255,0.25)"}}>
        <div className="card-header">
          <span className="card-icon">🌉</span>
          <div><div className="card-title">Live Testnet Bridge Demo</div><div className="card-subtitle">Sepolia → Solana Devnet · Wormhole NTT · Sunrise Liquidity</div></div>
          <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
            {status==="complete"&&<span className="tag tag-green">✓ Complete</span>}
            {status==="error"&&<span className="tag tag-red">✗ Error</span>}
            {isRunning&&<><span className="blink" style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",display:"inline-block"}}/><span className="tag tag-orange">Running</span></>}
          </div>
        </div>
        <div style={{background:"rgba(247,147,26,0.07)",border:"1px solid rgba(247,147,26,0.2)",borderRadius:"var(--radius)",padding:14,marginBottom:20,fontSize:13,color:"var(--text2)",lineHeight:1.7}}>
          <strong style={{color:"var(--accent)"}}>Demo mode</strong> — simulates full NTT flow with real-looking testnet tx IDs + explorer links. For live execution: <code style={{fontFamily:"var(--mono)",color:"var(--accent3)",fontSize:12}}>npx tsx wormhole-integration/migrate-token.ts</code>
        </div>
        <div className="grid-2" style={{gap:16,marginBottom:16}}>
          <div>
            <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Token</div>
            <div style={{background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:"var(--radius)",padding:"10px 14px",fontFamily:"var(--mono)",fontSize:13,color:"var(--accent3)",display:"flex",alignItems:"center",gap:8}}>
              <span>⟠</span>{tokenName}{parsed.isERC20&&<span className="tag tag-orange" style={{marginLeft:"auto"}}>ERC-20</span>}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Amount</div>
            <div style={{display:"flex",gap:8}}>
              {["1","10","100"].map(v=><button key={v} onClick={()=>!isRunning&&setAmt(v)} style={{flex:1,padding:"10px",borderRadius:"var(--radius)",border:`1px solid ${amt===v?"var(--accent)":"var(--border2)"}`,background:amt===v?"rgba(247,147,26,0.15)":"var(--bg3)",color:amt===v?"var(--accent)":"var(--text2)",fontFamily:"var(--mono)",fontSize:14,fontWeight:700,cursor:"pointer"}}>{v}</button>)}
            </div>
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Recipient (Solana devnet)</div>
          <input value={rcpt} onChange={e=>!isRunning&&setRcpt(e.target.value)} style={{width:"100%",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:"var(--radius)",padding:"10px 14px",color:"var(--text)",fontFamily:"var(--mono)",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
        </div>
        {status==="idle"&&<button className="nav-btn primary" style={{width:"100%",padding:"15px",fontSize:15,fontWeight:800}} onClick={run}>🚀 Launch Bridge Demo</button>}
        {isRunning&&<button className="nav-btn" style={{width:"100%",padding:"15px",cursor:"not-allowed"}} disabled><span style={{display:"inline-flex",alignItems:"center",gap:10}}><span style={{display:"inline-block",animation:"spin 0.8s linear infinite"}}>⟳</span>{STEPS[si]?.label}… ({(elapsed/1000).toFixed(1)}s)</span></button>}
        {(status==="complete"||status==="error")&&<button className="nav-btn" style={{width:"100%",padding:"14px"}} onClick={reset}>↺ Run Again</button>}
      </div>
      {/* Steps */}
      {status!=="idle"&&(
        <div className="card fade-up">
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:16}}>Bridge Steps</div>
          {STEPS.filter(s=>s.id!=="complete").map((step,i)=>{
            const done=i<si||status==="complete";const active=i===si&&isRunning;const pend=i>si&&!["complete","error"].includes(status);
            return(<div key={step.id} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"12px 0",borderBottom:i<4?"1px solid var(--border)":"none",opacity:pend?0.3:1,transition:"opacity .4s"}}>
              <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,background:done?"var(--accent3)":active?"var(--accent)":"var(--bg3)",border:`2px solid ${done?"var(--accent3)":active?"var(--accent)":"var(--border2)"}`,color:done||active?"#000":"var(--text3)",transition:"all .3s"}}>
                {done?"✓":i+1}
              </div>
              <div style={{flex:1,paddingTop:2}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontWeight:700,fontSize:14,color:done?"var(--accent3)":active?"var(--accent)":"var(--text)"}}>{step.label}</span>
                  {active&&<span className="blink" style={{width:7,height:7,borderRadius:"50%",background:"var(--accent)",display:"inline-block"}}/>}
                </div>
                <div style={{fontSize:12,color:"var(--text3)",fontFamily:"var(--mono)"}}>{step.desc}</div>
              </div>
            </div>);
          })}
          {status==="complete"&&<div className="fade-up" style={{marginTop:16,background:"rgba(25,251,155,0.08)",border:"1px solid rgba(25,251,155,0.3)",borderRadius:"var(--radius)",padding:16}}><div style={{fontWeight:800,fontSize:16,color:"var(--accent3)",marginBottom:6}}>✅ Transfer Complete!</div><p style={{fontSize:13,color:"var(--text2)",lineHeight:1.7,margin:0}}><strong>{amt} {tokenName}</strong> SPL tokens live on Solana Devnet. Recipient ATA created automatically.</p></div>}
        </div>
      )}
      {/* TXs */}
      {txs.length>0&&(
        <div className="card fade-up">
          <div className="card-header"><span className="card-icon">🔗</span><div className="card-title">Transaction Records</div><span className="tag tag-green" style={{marginLeft:"auto"}}>{txs.length} txs</span></div>
          {txs.map((tx,i)=>(
            <div key={i} style={{background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:"var(--radius)",padding:"14px 16px",marginBottom:10,animation:"fadeUp .4s ease"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:16}}>{tx.chain==="Sepolia"?"⟠":"◎"}</span>
                <span style={{fontWeight:700,fontSize:13,color:tx.chain==="Sepolia"?"#627EEA":"var(--accent2)"}}>{tx.chain}</span>
                <span style={{fontSize:12,color:"var(--text3)"}}>— {tx.label}</span>
                <span style={{marginLeft:"auto",fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>{tx.timestamp.toLocaleTimeString()}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <code style={{fontSize:11,color:"var(--accent3)",fontFamily:"var(--mono)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.chain==="Sepolia"?`0x${tx.txId}`:tx.txId}</code>
                <button onClick={()=>navigator.clipboard.writeText(tx.txId)} style={{background:"none",border:"1px solid var(--border2)",color:"var(--text3)",fontSize:11,padding:"3px 10px",borderRadius:4,cursor:"pointer",fontFamily:"var(--mono)"}}>copy</button>
                <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"var(--accent2)",fontFamily:"var(--mono)",border:"1px solid rgba(153,69,255,0.3)",padding:"3px 10px",borderRadius:4,textDecoration:"none"}}>Explorer ↗</a>
              </div>
            </div>
          ))}
          <div style={{padding:14,background:"rgba(153,69,255,0.06)",border:"1px solid rgba(153,69,255,0.2)",borderRadius:"var(--radius)",marginTop:8}}>
            <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",marginBottom:6}}>Cross-chain tracking</div>
            <a href="https://wormholescan.io/#/?network=Testnet" target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:"var(--accent2)",display:"flex",alignItems:"center",gap:6,textDecoration:"none"}}>🔍 View on Wormholescan ↗</a>
          </div>
        </div>
      )}
      {/* Log */}
      {logs.length>0&&(
        <div className="card">
          <div className="card-header"><span className="card-icon">📟</span><div className="card-title">Bridge Log</div><button onClick={()=>navigator.clipboard.writeText(logs.join("\n"))} style={{marginLeft:"auto",background:"none",border:"1px solid var(--border2)",color:"var(--text3)",fontSize:11,padding:"4px 10px",borderRadius:6,cursor:"pointer",fontFamily:"var(--mono)"}}>copy log</button></div>
          <div ref={logRef} style={{background:"var(--bg)",borderRadius:"var(--radius)",padding:16,fontFamily:"var(--mono)",fontSize:12,maxHeight:240,overflowY:"auto",lineHeight:1.9}}>
            {logs.map((line,i)=><div key={i} style={{color:line.includes("✓")||line.startsWith("✅")?"var(--accent3)":line.startsWith("❌")?"var(--red)":line.startsWith("☀")?"var(--accent)":"var(--text2)"}}>{line}</div>)}
            {isRunning&&<span className="blink" style={{display:"inline-block",color:"var(--accent3)"}}>▌</span>}
          </div>
        </div>
      )}
      {/* Sunrise */}
      <div className="card" style={{border:"1px solid rgba(247,147,26,0.3)",background:"linear-gradient(135deg,rgba(247,147,26,0.05),rgba(153,69,255,0.05))"}}>
        <div className="card-header"><span style={{fontSize:28}}>☀</span><div><div className="card-title" style={{color:"var(--accent)"}}>Post-Migration: Sunrise Liquidity</div><div className="card-subtitle">Canonical gateway for new Solana assets</div></div></div>
        <div className="grid-3" style={{marginBottom:20}}>
          {[{icon:"🏊",t:"Day-One Liquidity",d:"Sunrise bootstraps AMM pools for bridged tokens — no cold-start problem."},{icon:"🔀",t:"Smart AMM Routing",d:"Routed through Orca / Raydium via Sunrise for best execution."},{icon:"📈",t:"Price Discovery",d:"Managed bootstrapping prevents manipulation during initial trading."}].map(f=>(
            <div key={f.t} className="stat-box"><div style={{fontSize:22,marginBottom:8}}>{f.icon}</div><div style={{fontWeight:700,fontSize:13,marginBottom:6}}>{f.t}</div><div style={{fontSize:12,color:"var(--text2)",lineHeight:1.6}}>{f.d}</div></div>
          ))}
        </div>
        <div style={{background:"var(--bg3)",borderRadius:"var(--radius)",padding:14,marginBottom:16,fontSize:13,color:"var(--text2)",lineHeight:1.7,fontStyle:"italic",borderLeft:"3px solid var(--accent)"}}>
          "Post-migration, coordinate with Sunrise for day-one liquidity pools. Sunrise provides the canonical liquidity route for newly bridged assets entering the Solana ecosystem."
        </div>
        <div style={{display:"flex",gap:12}}>
          <a href="https://www.sunrisedefi.com/" target="_blank" rel="noopener noreferrer" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"var(--accent)",color:"#000",fontWeight:800,fontSize:14,padding:"13px",borderRadius:"var(--radius)",textDecoration:"none"}}>☀ Apply to Sunrise</a>
          <a href="https://x.com/Sunrise_DeFi" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"var(--bg3)",border:"1px solid var(--border2)",color:"var(--text)",fontWeight:600,fontSize:14,padding:"13px 20px",borderRadius:"var(--radius)",textDecoration:"none"}}>@Sunrise_DeFi ↗</a>
        </div>
      </div>
      {/* Error fallback */}
      {status==="error"&&(
        <div className="card fade-up" style={{border:"1px solid var(--red)"}}>
          <div className="card-header"><span className="card-icon">⚠</span><div className="card-title" style={{color:"var(--red)"}}>Fallback — CLI Script</div></div>
          <p style={{color:"var(--text2)",fontSize:13,lineHeight:1.7,marginBottom:16}}>Run the transfer directly from the terminal:</p>
          <div className="code-block"><pre style={{fontSize:11}}>{`cd wormhole-integration\n\nEVM_PRIVATE_KEY=0x... \\\nEVM_TOKEN_ADDRESS=0x... \\\nEVM_NTT_MANAGER=0x... \\\nSOLANA_RECIPIENT=${rcpt} \\\nTRANSFER_AMOUNT=${amt} \\\nnpx tsx migrate-token.ts\n\n# Check chains only:\nnpx tsx migrate-token.ts --chain-info`}</pre></div>
          {err&&<div style={{marginTop:12,fontFamily:"var(--mono)",fontSize:12,color:"var(--red)",background:"rgba(255,77,106,0.08)",padding:12,borderRadius:"var(--radius)"}}>{err}</div>}
        </div>
      )}
    </div>
  );
}