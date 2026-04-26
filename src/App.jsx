import { useState, useCallback, useEffect, useRef } from "react";

const CATEGORIES = [
  "All",
  "The Luminous","The Dark","The Weather","The Wandering","The Reckoning",
  "The Speaking","The Spent","The Sounding","The Knowing",
  "The Bodied","The Bound","The Creaturely","The Martial","The Domestic","The Nautical",
];

const C = {
  bg:           "#090806",
  bgPanel:      "#0c0a06",
  bgCard:       "#0f0d08",
  bgSelected:   "#1a1408",
  amber:        "#c88010",
  amberBright:  "#e89c12",
  amberGlow:    "#ffb422",
  amberHot:     "#ffd060",
  amberDim:     "#7a500a",
  amberFaint:   "#2a1e08",
  amberGhost:   "#130f04",
  border:       "#1e1608",
  borderBright: "#3d2c0a",
  textDim:      "#5a3c08",
  textGhost:    "#2a1e08",
  accent:       "#c0392b",
};

const mono    = "'Share Tech Mono', 'Courier New', monospace";
const display = "'Fraunces', 'Times New Roman', serif";
const body    = "'Instrument Serif', 'Georgia', serif";

const HOARD_KEY = "glimrede-saved-words";

// ── Small components ──────────────────────────────────────────────────────────

const Scanlines = () => (
  <div style={{
    background:`repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)`,
    position:"fixed", inset:0, pointerEvents:"none", zIndex:200, opacity:0.3,
  }} />
);

const Vignette = () => (
  <div style={{
    background:`radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.32) 100%)`,
    position:"fixed", inset:0, pointerEvents:"none", zIndex:199,
  }} />
);

const Label = ({ children, style, className }) => (
  <span className={["label-glow", className].filter(Boolean).join(" ")} style={{
    fontFamily:mono, fontSize:8, letterSpacing:"0.26em",
    color:C.textDim, ...style,
  }}>{children}</span>
);

const Pip = ({ color }) => (
  <span style={{
    display:"inline-block", width:5, height:5,
    borderRadius:"50%", background: color || C.amberDim,
    flexShrink:0,
    boxShadow: color ? `0 0 4px ${color}` : "none",
  }} />
);

const HRule = ({ style }) => (
  <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.borderBright},transparent)`, ...style }} />
);

const CardSection = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", borderTop:`1px solid ${C.border}` }}>
    <Pip />
    <span style={{ fontFamily:mono, fontSize:7, letterSpacing:"0.3em", color:C.textDim }}>{label}</span>
    <div style={{ flex:1, height:1, background:C.border }} />
  </div>
);

function HdrBtn({ children, onClick, active }) {
  return (
    <button onClick={onClick} className="cat-btn" style={{
      background: active ? "rgba(180,120,10,0.1)" : "none",
      border:"none", borderLeft:`1px solid ${C.border}`,
      color: active ? C.amberGlow : C.textDim,
      fontFamily:mono, fontSize:8, letterSpacing:"0.2em",
      padding:"0 16px", height:"100%",
      textShadow: active ? "0 0 8px rgba(255,175,30,0.7)" : "none",
    }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, active, style }) {
  return (
    <button onClick={onClick} className="cat-btn" style={{
      background:"none",
      border:`1px solid ${active ? C.amberDim : C.border}`,
      color: active ? C.amberGlow : C.textDim,
      fontFamily:mono, fontSize:8, letterSpacing:"0.18em",
      padding:"4px 12px",
      textShadow: active ? "0 0 6px rgba(255,175,30,0.6)" : "none",
      ...style,
    }}>{children}</button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Glimrede() {
  const [corpus,        setCorpus]      = useState([]);
  const [loading,       setLoading]     = useState(true);
  const [search,        setSearch]      = useState("");
  const [selected,      setSelected]    = useState(null);
  const [activeCat,     setActiveCat]   = useState("All");
  const [writerMode,    setWriterMode]  = useState(false);
  const [flashKey,      setFlashKey]    = useState(0);
  const [wordKey,       setWordKey]     = useState(0);

  const [crossInput,   setCrossInput]   = useState("");
  const [crossResult,  setCrossResult]  = useState(null);
  const [crossLoading, setCrossLoading] = useState(false);

  const [kennA,        setKennA]        = useState("");
  const [kennB,        setKennB]        = useState("");
  const [kennResult,   setKennResult]   = useState(null);
  const [kennLoading,  setKennLoading]  = useState(false);

  const [kennHistory,  setKennHistory]  = useState([]);
  const [showLog,      setShowLog]      = useState(false);
  const [showHoard,    setShowHoard]    = useState(false);
  const [hoards,       setHoards]       = useState(new Set());

  const listRef = useRef(null);

  useEffect(() => {
    fetch("/words.json")
      .then(r => r.json())
      .then(data => {
        setCorpus(data);
        const ERA_WEIGHT = { "Old English":3, "Middle English":3, "Early Modern English":2 };
        const weighted = data.flatMap(w => Array(ERA_WEIGHT[w.era]||1).fill(w));
        setSelected(weighted[Math.floor(Math.random()*weighted.length)] || data[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    try { const s=localStorage.getItem(HOARD_KEY); if(s) setHoards(new Set(JSON.parse(s))); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(HOARD_KEY, JSON.stringify([...hoards])); } catch {}
  }, [hoards]);

  const toggleHoard = useCallback((word) => {
    setHoards(prev => { const n=new Set(prev); n.has(word)?n.delete(word):n.add(word); return n; });
  }, []);

  const selectWord = useCallback((w) => {
    setSelected(w); setWordKey(k=>k+1);
  }, []);

  const encounter = useCallback(() => {
    if (!corpus.length) return;
    const ERA_WEIGHT = { "Old English":3, "Middle English":3, "Early Modern English":2 };
    const pool = corpus.filter(w => w !== selected);
    const weighted = pool.flatMap(w => Array(ERA_WEIGHT[w.era]||1).fill(w));
    const pick = weighted[Math.floor(Math.random()*weighted.length)];
    selectWord(pick);
    setActiveCat("All"); setSearch("");
    setFlashKey(k=>k+1);
  }, [corpus, selected, selectWord]);

  const filtered = corpus.filter(w => {
    const q = search.toLowerCase();
    const matchS = !q || w.word.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q) || w.category?.toLowerCase().includes(q);
    const matchC = activeCat==="All" || w.category===activeCat;
    return matchS && matchC;
  });

  const transmute = useCallback(async () => {
    if (!crossInput.trim() || crossLoading) return;
    setCrossLoading(true); setCrossResult(null);
    try {
      const res = await fetch("/api/transmute", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ word: crossInput.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCrossResult(data);
    } catch { setCrossResult({ error:true }); }
    setCrossLoading(false);
  }, [crossInput, crossLoading]);

  const forge = useCallback(async () => {
    if (!kennA.trim() || !kennB.trim() || kennLoading) return;
    setKennLoading(true); setKennResult(null);
    try {
      const res = await fetch("/api/forge", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ a: kennA.trim(), b: kennB.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setKennResult(data);
      setKennHistory(prev => [
        { a:kennA.trim(), b:kennB.trim(), kennings:data.kennings, ts:Date.now() },
        ...prev
      ].slice(0,20));
    } catch { setKennResult({ error:true }); }
    setKennLoading(false);
  }, [kennA, kennB, kennLoading]);

  if (loading) return (
    <div style={{ background:C.bg, height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
      <Scanlines />
      <div className="word-glow" style={{ fontFamily:display, fontSize:32, color:C.amberGlow, letterSpacing:"0.08em" }}>Glimrede</div>
      <Label style={{ letterSpacing:"0.35em", color:C.textDim }}>LOADING CORPUS...</Label>
    </div>
  );

  return (
    <div style={{ background:C.bg, color:C.amber, fontFamily:mono, height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
      <Scanlines />
      <Vignette />

      {/* ── HEADER ── */}
      <div style={{ borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"stretch", height:40, background:`linear-gradient(180deg,#0f0c06,${C.bg})`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, padding:"0 20px" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:10, borderRight:`1px solid ${C.border}`, paddingRight:18 }}>
            <span className="word-glow" style={{ fontFamily:mono, fontSize:13, letterSpacing:"0.35em", color:C.amberGlow }}>GLIMREDE</span>
          </div>
          <Label className="hoverable-dim" style={{ letterSpacing:"0.18em" }}>A THESAURUS OF LOST LANGUAGE</Label>
        </div>
        <div style={{ display:"flex", alignItems:"stretch" }}>
          <HdrBtn onClick={encounter}>ENCOUNTER</HdrBtn>
          <HdrBtn onClick={() => setWriterMode(m=>!m)} active={writerMode}>{writerMode?"WRITER ◉":"WRITER ○"}</HdrBtn>
          <div style={{ display:"flex", alignItems:"center", padding:"0 16px", borderLeft:`1px solid ${C.border}` }}>
            <Label className="hoverable-dim"><span style={{ color:C.amberDim }}>{corpus.length}</span> ENTRIES</Label>
          </div>
        </div>
      </div>

      {/* ── CATEGORY STRIP ── */}
      <div style={{ borderBottom:`1px solid ${C.border}`, display:"flex", overflowX:"auto", scrollbarWidth:"none", background:C.bgPanel, flexShrink:0 }}>
        {CATEGORIES.map(cat => {
          const active = activeCat===cat;
          return (
            <button key={cat} onClick={() => setActiveCat(cat)} className="cat-btn" style={{
              background:"none", border:"none",
              borderBottom: active ? `2px solid ${C.amberGlow}` : "2px solid transparent",
              borderRight:`1px solid ${C.border}`,
              fontFamily:mono, fontSize:7.5, letterSpacing:"0.15em",
              color: active ? C.amberGlow : C.textDim,
              padding:"8px 12px", whiteSpace:"nowrap",
              textShadow: active ? "0 0 8px rgba(255,175,30,0.8)" : "none",
              flexShrink:0,
            }}>{cat.toUpperCase()}</button>
          );
        })}
      </div>

      {/* ── THREE COLUMN BODY ── */}
      <div style={{ display:"grid", gridTemplateColumns:"190px 1fr 280px", flex:1, overflow:"hidden", minHeight:0 }}>

        {/* ── LEFT: Word list ── */}
        <div style={{ borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"8px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <Label style={{ color:C.amberDim, fontSize:7 }}>SEEK</Label>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              style={{ flex:1, background:"none", border:"none", borderBottom:`1px solid ${C.borderBright}`, color:C.amberGlow, fontFamily:mono, fontSize:9, letterSpacing:"0.1em", padding:"2px 0" }} />
          </div>
          <div ref={listRef} style={{ overflowY:"auto", flex:1, minHeight:0 }}>
            {filtered.length===0 && <div style={{ padding:"14px 12px", fontSize:8, color:C.textDim }}>NO MATCH</div>}
            {filtered.map(w => {
              const isSel = selected?.word===w.word;
              return (
                <div key={w.word} className="list-item" onClick={() => selectWord(w)} style={{
                  padding:"7px 12px", cursor:"pointer",
                  background: isSel ? C.bgSelected : "transparent",
                  borderBottom:`1px solid ${C.border}`,
                  borderLeft: isSel ? `2px solid ${C.amberGlow}` : "2px solid transparent",
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                }}>
                  <div>
                    <div className={isSel ? "word-glow" : "list-word"} style={{
                      fontSize:13, fontFamily:display,
                      color: isSel ? C.amberHot : C.amberGlow,
                      textShadow: isSel ? "0 0 8px rgba(255,175,30,0.7)" : "none",
                      transition:"color 0.15s, text-shadow 0.15s",
                    }}>{w.word}</div>
                    <div style={{ fontSize:7, color:C.amberDim, letterSpacing:"0.12em", marginTop:1 }}>
                      {w.category?.replace("The ","").toUpperCase()}
                    </div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();toggleHoard(w.word);}} style={{
                    background:"none", border:"none", padding:"2px 4px",
                    fontSize:11, color: hoards.has(w.word) ? C.amberGlow : C.amberGhost,
                    textShadow: hoards.has(w.word) ? "0 0 6px rgba(255,175,30,0.8)" : "none",
                    flexShrink:0,
                  }}>{hoards.has(w.word)?"★":"☆"}</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CENTRE: Word card ── */}
        <div key={flashKey} className={flashKey>0?"encounter-flash":""} style={{ overflowY:"auto", minHeight:0, padding:"20px 24px" }}>
          {selected && !writerMode && (
            <div key={wordKey} className="word-reveal" style={{ border:`1px solid ${C.borderBright}`, background:C.bgCard, width:"100%" }}>
              {/* Word + hoard */}
              <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div className="word-glow word-hover" style={{ fontFamily:display, fontSize:42, fontWeight:400, color:C.amberHot, lineHeight:1, cursor:"default", transition:"text-shadow 0.2s" }}>
                  {selected.word}
                </div>
                <button onClick={()=>toggleHoard(selected.word)} style={{ background:"none", border:"none", fontSize:18, color:hoards.has(selected.word)?C.amberGlow:C.amberFaint, textShadow:hoards.has(selected.word)?"0 0 8px rgba(255,175,30,0.9)":"none", padding:"2px 4px", marginTop:2 }}>
                  {hoards.has(selected.word)?"★":"☆"}
                </button>
              </div>
              {/* Meta */}
              <div style={{ padding:"8px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                <Pip color={C.amberDim} />
                <Label className="hoverable-dim" style={{ color:C.amberDim }}>/{selected.pronunciation}/</Label>
                <span style={{ color:C.border }}>·</span>
                <Label className="hoverable-dim">{selected.era?.toUpperCase()}</Label>
                <span style={{ color:C.border }}>·</span>
                <Label className="hoverable-dim">{selected.category?.toUpperCase()}</Label>
              </div>
              {/* Definition */}
              <div style={{ padding:"16px 20px" }}>
                <div className="hoverable" style={{ fontFamily:body, fontSize:14, color:C.amberBright, lineHeight:1.82 }}>
                  {selected.definition}
                </div>
              </div>
              {/* What was lost */}
              {selected.lost && (
                <>
                  <CardSection label="WHAT WAS LOST" />
                  <div style={{ padding:"0 20px 14px" }}>
                    <div className="hoverable-dim" style={{ fontFamily:mono, fontSize:10.5, color:C.amberDim, lineHeight:1.9, letterSpacing:"0.03em" }}>
                      {selected.lost}
                    </div>
                  </div>
                </>
              )}
              {/* In use */}
              {selected.usage && (
                <>
                  <CardSection label="IN USE" />
                  <div style={{ padding:"0 20px 16px" }}>
                    <div className="hoverable-dim" style={{ fontFamily:body, fontSize:12, color:C.amberDim, lineHeight:1.85, fontStyle:"italic" }}>
                      "{selected.usage}"
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Writer mode */}
          {selected && writerMode && (
            <div style={{ maxWidth:520 }}>
              <div className="word-glow" style={{ fontFamily:display, fontSize:48, color:C.amberHot, lineHeight:1, marginBottom:10 }}>{selected.word}</div>
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:24 }}>
                <Label style={{ color:C.amberDim }}>/{selected.pronunciation}/</Label>
                <span style={{ color:C.border }}>·</span>
                <Label>{selected.era?.toUpperCase()}</Label>
              </div>
              <HRule style={{ marginBottom:20 }} />
              <div style={{ fontFamily:body, fontSize:14, color:C.amberBright, lineHeight:1.88, marginBottom:28 }}>{selected.definition}</div>
              {selected.lost && (
                <div style={{ fontFamily:mono, fontSize:10.5, color:C.amberDim, lineHeight:1.9, marginBottom:28, paddingLeft:14, borderLeft:`2px solid ${C.amberFaint}`, letterSpacing:"0.03em" }}>
                  {selected.lost}
                </div>
              )}
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <GhostBtn onClick={()=>navigator.clipboard?.writeText(`${selected.word} — ${selected.definition}`)}>COPY WORD + DEF</GhostBtn>
                <GhostBtn onClick={()=>navigator.clipboard?.writeText(selected.definition)}>COPY DEF ONLY</GhostBtn>
                <GhostBtn onClick={()=>toggleHoard(selected.word)} active={hoards.has(selected.word)}>{hoards.has(selected.word)?"★ HOARDED":"☆ HOARD"}</GhostBtn>
                <GhostBtn onClick={encounter} style={{ marginLeft:"auto" }}>NEXT ›</GhostBtn>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Instrument panel ── */}
        <div style={{ borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden", background:C.bgPanel }}>

          {/* Panel header */}
          <div style={{ padding:"8px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <Pip color={C.amberGlow} />
            <Label style={{ color:C.amberDim, letterSpacing:"0.22em" }}>INSTRUMENT PANEL</Label>
          </div>

          <div style={{ overflowY:"auto", flex:1, minHeight:0 }}>

            {/* ── Cross-pollinator ── */}
            <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                <Pip />
                <Label style={{ letterSpacing:"0.2em" }}>CROSS-POLLINATOR</Label>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                <input placeholder="a modern word" value={crossInput} onChange={e=>setCrossInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&transmute()}
                  style={{ flex:1, background:"none", border:"none", borderBottom:`1px solid ${C.borderBright}`, color:C.amberGlow, fontFamily:mono, fontSize:9, letterSpacing:"0.08em", padding:"3px 0" }} />
                <button onClick={transmute} disabled={crossLoading} className="cat-btn" style={{ background:"none", border:`1px solid ${C.borderBright}`, color:crossLoading?C.textDim:C.amberBright, fontFamily:mono, fontSize:7, letterSpacing:"0.2em", padding:"4px 10px", flexShrink:0 }}>
                  {crossLoading?"…":"GO"}
                </button>
              </div>
              <Label className="hoverable" style={{ fontSize:6.5, color:C.textGhost }}>↑ ENTER A WORD · RECEIVE THREE SHADOWS</Label>

              {crossResult && !crossResult.error && (
                <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:10 }}>
                  {[["oe","ARCHAIC"],["naut","NAUTICAL"],["leg","LEGALISM"]].map(([key,label]) => (
                    <div key={key} style={{ borderLeft:`2px solid ${C.amberFaint}`, paddingLeft:10 }}>
                      <Label style={{ fontSize:6.5, marginBottom:4, display:"block" }}>{label}</Label>
                      <div className="word-glow word-hover" style={{ fontFamily:display, fontSize:17, color:C.amberGlow, marginBottom:3, cursor:"default", transition:"text-shadow 0.2s" }}>{crossResult[key]?.word}</div>
                      <div className="hoverable-dim" style={{ fontFamily:body, fontSize:10, color:C.amberDim, fontStyle:"italic", lineHeight:1.5 }}>{crossResult[key]?.gloss}</div>
                    </div>
                  ))}
                </div>
              )}
              {crossResult?.error && <div style={{ fontFamily:body, fontStyle:"italic", fontSize:10, color:C.textDim, marginTop:8 }}>— the signal was lost —</div>}
            </div>

            {/* ── Kenning forge ── */}
            <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                <Pip />
                <Label style={{ letterSpacing:"0.2em" }}>KENNING FORGE</Label>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
                <input placeholder="concept" value={kennA} onChange={e=>setKennA(e.target.value)} onKeyDown={e=>e.key==="Enter"&&forge()}
                  style={{ flex:1, background:"none", border:"none", borderBottom:`1px solid ${C.borderBright}`, color:C.amberGlow, fontFamily:mono, fontSize:9, padding:"3px 0" }} />
                <span style={{ color:C.amberDim, fontFamily:display, fontSize:14 }}>+</span>
                <input placeholder="concept" value={kennB} onChange={e=>setKennB(e.target.value)} onKeyDown={e=>e.key==="Enter"&&forge()}
                  style={{ flex:1, background:"none", border:"none", borderBottom:`1px solid ${C.borderBright}`, color:C.amberGlow, fontFamily:mono, fontSize:9, padding:"3px 0" }} />
                <button onClick={forge} disabled={kennLoading} className="cat-btn" style={{ background:"none", border:`1px solid ${C.borderBright}`, color:kennLoading?C.textDim:C.amberBright, fontFamily:mono, fontSize:7, letterSpacing:"0.2em", padding:"4px 10px", flexShrink:0 }}>
                  {kennLoading?"…":"FORGE"}
                </button>
              </div>
              <Label className="hoverable" style={{ fontSize:6.5, color:C.textGhost }}>↑ TWO CONCEPTS · FOUR KENNINGS</Label>

              {kennResult && !kennResult.error && kennResult.kennings && (
                <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {kennResult.kennings.map((k,i) => (
                    <div key={i} style={{ borderTop:`1px solid ${C.border}`, paddingTop:8 }}>
                      <div className="word-glow word-hover" style={{ fontFamily:display, fontSize:15, color:C.amberGlow, marginBottom:3, cursor:"default", transition:"text-shadow 0.2s" }}>{k.compound}</div>
                      <div style={{ fontFamily:mono, fontSize:7, color:C.amberDim, letterSpacing:"0.1em", marginBottom:4 }}>{k.names?.toUpperCase()}</div>
                      <div className="hoverable-dim" style={{ fontFamily:body, fontSize:9.5, color:C.amberDim, fontStyle:"italic", lineHeight:1.6 }}>{k.logic}</div>
                    </div>
                  ))}
                </div>
              )}
              {kennResult?.error && <div style={{ fontFamily:body, fontStyle:"italic", fontSize:10, color:C.textDim, marginTop:8 }}>— the forge went cold —</div>}
            </div>

            {/* ── Forge log (collapsible) ── */}
            <div style={{ borderBottom:`1px solid ${C.border}` }}>
              <button onClick={()=>setShowLog(l=>!l)} className="cat-btn" style={{ width:"100%", background:"none", border:"none", padding:"9px 14px", display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <Pip />
                <Label style={{ letterSpacing:"0.2em" }}>FORGE LOG</Label>
                {kennHistory.length>0 && <span style={{ fontFamily:mono, fontSize:7, color:C.amberDim, marginLeft:4 }}>[{kennHistory.length}]</span>}
                <span style={{ marginLeft:"auto", fontFamily:mono, fontSize:8, color:C.textDim }}>{showLog?"▾":"▸"}</span>
              </button>
              {showLog && (
                <div style={{ padding:"0 14px 12px" }}>
                  {kennHistory.length===0 && <div style={{ fontFamily:body, fontStyle:"italic", fontSize:10, color:C.amberGhost }}>No forgings yet.</div>}
                  {kennHistory.map((entry,i) => (
                    <div key={entry.ts} style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:10, marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                        <span style={{ fontFamily:mono, fontSize:8, color:C.amberBright, letterSpacing:"0.14em" }}>{entry.a} + {entry.b}</span>
                        <button onClick={()=>setKennHistory(prev=>prev.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:C.textDim, fontFamily:mono, fontSize:7, padding:0 }}>✕</button>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px" }}>
                        {entry.kennings?.map((k,j) => (
                          <div key={j} style={{ fontFamily:display, fontSize:12, color:C.amber }}>{k.compound}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {kennHistory.length>0 && <GhostBtn onClick={()=>setKennHistory([])}>CLEAR ALL</GhostBtn>}
                </div>
              )}
            </div>

            {/* ── My hoard (collapsible) ── */}
            <div>
              <button onClick={()=>setShowHoard(h=>!h)} className="cat-btn" style={{ width:"100%", background:"none", border:"none", padding:"9px 14px", display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <Pip />
                <Label style={{ letterSpacing:"0.2em" }}>MY HOARD</Label>
                {hoards.size>0 && <span style={{ fontFamily:mono, fontSize:7, color:C.amberDim, marginLeft:4 }}>[{hoards.size}]</span>}
                <span style={{ marginLeft:"auto", fontFamily:mono, fontSize:8, color:C.textDim }}>{showHoard?"▾":"▸"}</span>
              </button>
              {showHoard && (
                <div style={{ padding:"0 14px 12px" }}>
                  {hoards.size===0 && <div style={{ fontFamily:body, fontStyle:"italic", fontSize:10, color:C.amberGhost }}>Mark words with ☆ to collect them here.</div>}
                  {hoards.size>0 && (
                    <>
                      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
                        {corpus.filter(w=>hoards.has(w.word)).map(w => (
                          <div key={w.word} onClick={()=>{selectWord(w);setActiveCat("All");}} style={{ cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"5px 0", borderBottom:`1px solid ${C.border}` }}>
                            <div>
                              <span className="list-word" style={{ fontFamily:display, fontSize:14, color:C.amberGlow, marginRight:8 }}>{w.word}</span>
                              <span style={{ fontFamily:mono, fontSize:7, color:C.textDim, letterSpacing:"0.1em" }}>{w.era?.toUpperCase()}</span>
                            </div>
                            <button onClick={e=>{e.stopPropagation();toggleHoard(w.word);}} style={{ background:"none", border:"none", color:C.amberGlow, fontSize:11, padding:"0 2px", textShadow:"0 0 6px rgba(255,175,30,0.8)" }}>★</button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <GhostBtn onClick={()=>{const t=corpus.filter(w=>hoards.has(w.word)).map(w=>`${w.word}\n${w.definition}\n`).join("\n");navigator.clipboard?.writeText(t);}}>COPY ALL</GhostBtn>
                        <GhostBtn onClick={()=>setHoards(new Set())}>CLEAR</GhostBtn>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>{/* end right scroll */}
        </div>{/* end right panel */}
      </div>{/* end three-col grid */}
    </div>
  );
}
