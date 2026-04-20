import { useState, useCallback, useEffect, useRef } from "react";

const CATEGORIES = [
  "All",
  "The Luminous","The Dark","The Weather","The Wandering","The Reckoning",
  "The Speaking","The Spent","The Sounding","The Knowing",
  "The Bodied","The Bound","The Creaturely",
];

const C = {
  bg:           "#090806",
  bgPanel:      "#0d0b07",
  bgSelected:   "#1a1408",
  bgHover:      "#141008",
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
};

const mono   = "'Share Tech Mono', 'Courier New', monospace";
const serif  = "'IM Fell English', Georgia, serif";
const plex   = "'IBM Plex Mono', 'Courier New', monospace";

const HOARD_KEY = "glimrede-saved-words";

// Corner bracket decoration
function Brackets({ children, style, size = 10, color }) {
  const c = color || C.amberDim;
  const br = { position:"absolute", width:size, height:size };
  return (
    <div style={{ position:"relative", ...style }}>
      <span style={{ ...br, top:0, left:0,   borderTop:`1px solid ${c}`, borderLeft:`1px solid ${c}` }} />
      <span style={{ ...br, top:0, right:0,  borderTop:`1px solid ${c}`, borderRight:`1px solid ${c}` }} />
      <span style={{ ...br, bottom:0, left:0,  borderBottom:`1px solid ${c}`, borderLeft:`1px solid ${c}` }} />
      <span style={{ ...br, bottom:0, right:0, borderBottom:`1px solid ${c}`, borderRight:`1px solid ${c}` }} />
      {children}
    </div>
  );
}

// Scanline overlay
const Scanlines = () => (
  <div style={{
    background: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.22) 2px,
      rgba(0,0,0,0.22) 4px
    )`,
    position:"fixed", inset:0, pointerEvents:"none", zIndex:200, opacity:0.22,
  }} />
);

// Vignette
const Vignette = () => (
  <div style={{
    background:`radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)`,
    position:"fixed", inset:0, pointerEvents:"none", zIndex:199,
  }} />
);

// Readout label
const Label = ({ children, style }) => (
  <span className="label-glow" style={{
    fontFamily:mono, fontSize:8, letterSpacing:"0.28em",
    color:C.textDim, ...style,
  }}>{children}</span>
);

// Thin rule
const Rule = ({ style }) => (
  <div style={{ height:1, background:`linear-gradient(90deg, transparent, ${C.borderBright}, transparent)`, ...style }} />
);

// Card section divider: label left, rule extends right
const CardSection = ({ label }) => (
  <div style={{
    display:"flex", alignItems:"center", gap:10,
    padding:"12px 22px", borderTop:`1px solid ${C.border}`,
  }}>
    <span style={{
      fontFamily:mono, fontSize:7, letterSpacing:"0.28em",
      color:C.textDim, whiteSpace:"nowrap",
    }}>{label}</span>
    <div style={{ flex:1, height:1, background:C.border }} />
  </div>
);

export default function Glimrede() {
  const [corpus,        setCorpus]       = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [search,        setSearch]       = useState("");
  const [selected,      setSelected]     = useState(null);
  const [activeCat,     setActiveCat]    = useState("All");
  const [writerMode,    setWriterMode]   = useState(false);
  const [flashKey,      setFlashKey]     = useState(0);
  const [wordKey,       setWordKey]      = useState(0);

  const [crossInput,  setCrossInput]   = useState("");
  const [crossResult, setCrossResult]  = useState(null);
  const [crossLoading,setCrossLoading] = useState(false);

  const [kennA,       setKennA]        = useState("");
  const [kennB,       setKennB]        = useState("");
  const [kennResult,  setKennResult]   = useState(null);
  const [kennLoading, setKennLoading]  = useState(false);
  const [kennHistory, setKennHistory]  = useState([]);

  const [activePanel, setActivePanel]  = useState("cross");
  const [hoards,      setHoards]       = useState(new Set());

  const listRef = useRef(null);

  // Load corpus
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

  // Load / save hoards
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
    setSelected(w);
    setWordKey(k => k+1);
  }, []);

  const encounter = useCallback(() => {
    if (!corpus.length) return;
    const ERA_WEIGHT = { "Old English":3, "Middle English":3, "Early Modern English":2 };
    const pool    = corpus.filter(w => w !== selected);
    const weighted = pool.flatMap(w => Array(ERA_WEIGHT[w.era]||1).fill(w));
    const pick    = weighted[Math.floor(Math.random()*weighted.length)];
    selectWord(pick);
    setActiveCat("All");
    setSearch("");
    setFlashKey(k => k+1);
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
        method:"POST",
        headers:{"Content-Type":"application/json"},
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
        method:"POST",
        headers:{"Content-Type":"application/json"},
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
    <div style={{
      background:C.bg, height:"100vh",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:16,
    }}>
      <Scanlines />
      <div className="word-glow phosphorPulse" style={{
        fontFamily:mono, fontSize:13, letterSpacing:"0.4em", color:C.amberGlow,
      }}>GLIMREDE</div>
      <div style={{ fontFamily:mono, fontSize:8, letterSpacing:"0.3em", color:C.textDim }}>
        INITIALISING CORPUS...
      </div>
    </div>
  );

  return (
    <div style={{ background:C.bg, color:C.amber, fontFamily:mono, minHeight:"100vh", position:"relative" }}>
      <Scanlines />
      <Vignette />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div style={{
        borderBottom:`1px solid ${C.border}`,
        padding:"0 20px",
        display:"flex", justifyContent:"space-between", alignItems:"stretch",
        height:42,
        background:`linear-gradient(180deg, #0f0c06 0%, ${C.bg} 100%)`,
      }}>
        {/* Left: logo + tagline */}
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:10, borderRight:`1px solid ${C.border}`, paddingRight:20 }}>
            <span className="word-glow" style={{
              fontFamily:mono, fontSize:14, letterSpacing:"0.35em", color:C.amberGlow,
            }}>GLIMREDE</span>
          </div>
          <Label style={{ letterSpacing:"0.2em" }}>A THESAURUS OF LOST LANGUAGE</Label>
        </div>
        {/* Right: controls */}
        <div style={{ display:"flex", alignItems:"stretch", gap:0 }}>
          <HdrBtn onClick={encounter}>ENCOUNTER</HdrBtn>
          <HdrBtn
            onClick={() => setWriterMode(m => !m)}
            active={writerMode}
          >{writerMode ? "WRITER ◉" : "WRITER ○"}</HdrBtn>
          <div style={{
            display:"flex", alignItems:"center",
            padding:"0 16px", borderLeft:`1px solid ${C.border}`,
          }}>
            <Label>
              <span style={{ color:C.amberDim }}>{corpus.length}</span>
              {" "}ENTRIES
            </Label>
          </div>
        </div>
      </div>

      {/* ── CATEGORY STRIP ──────────────────────────────────────── */}
      <div style={{
        borderBottom:`1px solid ${C.border}`,
        padding:"0 20px",
        display:"flex", gap:0, overflowX:"auto", scrollbarWidth:"none",
        background:C.bgPanel,
      }}>
        {CATEGORIES.map(cat => {
          const active = activeCat===cat;
          return (
            <button key={cat} onClick={() => setActiveCat(cat)} style={{
              background:"none", border:"none",
              borderBottom: active ? `2px solid ${C.amberGlow}` : "2px solid transparent",
              borderRight: `1px solid ${C.border}`,
              cursor:"pointer",
              fontFamily:mono, fontSize:8, letterSpacing:"0.18em",
              color: active ? C.amberGlow : C.textDim,
              padding:"10px 14px", whiteSpace:"nowrap",
              textShadow: active ? "0 0 8px rgba(255,175,30,0.8)" : "none",
              transition:"color 0.15s, text-shadow 0.15s",
            }}>
              {cat.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* ── BODY ────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", minHeight:"calc(100vh - 250px)" }}>

        {/* Word list */}
        <div style={{ borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column" }}>
          {/* Search */}
          <div style={{ padding:"10px 12px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Label>SEEK</Label>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex:1, background:"none", border:"none",
                  borderBottom:`1px solid ${C.borderBright}`,
                  color:C.amberGlow, fontFamily:mono, fontSize:10,
                  letterSpacing:"0.1em", padding:"3px 0",
                }}
              />
              <span className="blink" style={{
                fontFamily:mono, fontSize:12, color:C.amberDim,
                animation:"blink 1.1s step-end infinite",
              }}>_</span>
            </div>
          </div>
          {/* List */}
          <div ref={listRef} style={{ overflowY:"auto", flex:1 }}>
            {filtered.length===0 && (
              <div style={{ padding:"16px 12px", fontSize:9, color:C.textDim, letterSpacing:"0.12em" }}>
                NO MATCH
              </div>
            )}
            {filtered.map(w => {
              const isSelected = selected?.word===w.word;
              return (
                <div key={w.word} className="list-item" onClick={() => selectWord(w)} style={{
                  padding:"8px 12px",
                  cursor:"pointer",
                  background: isSelected ? C.bgSelected : "transparent",
                  borderBottom:`1px solid ${C.border}`,
                  borderLeft: isSelected ? `2px solid ${C.amberGlow}` : "2px solid transparent",
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                }}>
                  <div>
                    <div className={isSelected ? "word-glow" : "list-word"} style={{
                      fontSize:13, fontFamily:serif,
                      color: isSelected ? C.amberHot : C.amberGlow,
                      textShadow: isSelected ? "0 0 8px rgba(255,175,30,0.7)" : "none",
                      transition:"color 0.15s, text-shadow 0.15s",
                    }}>{w.word}</div>
                    <div style={{ fontSize:7, color:C.amberDim, letterSpacing:"0.12em", marginTop:2 }}>
                      {w.category?.replace("The ","").toUpperCase()}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleHoard(w.word); }} style={{
                    background:"none", border:"none", padding:"2px 4px",
                    fontSize:11, color: hoards.has(w.word) ? C.amberGlow : C.amberGhost,
                    lineHeight:1, flexShrink:0,
                    textShadow: hoards.has(w.word) ? "0 0 6px rgba(255,175,30,0.8)" : "none",
                  }}>
                    {hoards.has(w.word) ? "★" : "☆"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Entry panel */}
        <div
          key={flashKey}
          className={flashKey > 0 ? "encounter-flash" : ""}
          style={{ padding:"24px 28px", overflowY:"auto", position:"relative", display:"flex", justifyContent:"center", alignItems:"flex-start" }}
        >
          {selected && !writerMode && (
            <div
              key={wordKey}
              className="word-reveal"
              style={{
                width:"100%", maxWidth:640,
                border:`1px solid ${C.borderBright}`,
                background:C.bgPanel,
                boxShadow:`0 4px 32px rgba(0,0,0,0.7), 0 0 1px rgba(180,120,10,0.2)`,
              }}
            >
              {/* Word + hoard */}
              <div style={{
                padding:"20px 22px 16px",
                borderBottom:`1px solid ${C.border}`,
                display:"flex", justifyContent:"space-between", alignItems:"flex-start",
              }}>
                <div className="word-glow" style={{
                  fontFamily:serif, fontSize:38, fontWeight:400,
                  color:C.amberHot, lineHeight:1.05, letterSpacing:"0.01em",
                }}>
                  {selected.word}
                </div>
                <button onClick={() => toggleHoard(selected.word)} style={{
                  background:"none", border:"none", marginTop:2,
                  fontSize:18, color: hoards.has(selected.word) ? C.amberGlow : C.amberFaint,
                  textShadow: hoards.has(selected.word) ? "0 0 8px rgba(255,175,30,0.9)" : "none",
                  padding:"2px 4px", flexShrink:0,
                }}>
                  {hoards.has(selected.word) ? "★" : "☆"}
                </button>
              </div>

              {/* Meta row */}
              <div style={{
                padding:"9px 22px",
                borderBottom:`1px solid ${C.border}`,
                display:"flex", gap:12, alignItems:"center", flexWrap:"wrap",
              }}>
                <Label style={{ color:C.amberDim }}>/{selected.pronunciation}/</Label>
                <span style={{ color:C.border }}>·</span>
                <Label>{selected.era?.toUpperCase()}</Label>
                <span style={{ color:C.border }}>·</span>
                <Label>{selected.category?.toUpperCase()}</Label>
              </div>

              {/* Definition */}
              <div style={{ padding:"18px 22px" }}>
                <div className="hoverable" style={{
                  fontFamily:plex, fontSize:12, color:C.amberBright,
                  lineHeight:1.9, letterSpacing:"0.02em",
                  textDecoration:"none",
                }}>
                  {selected.definition}
                </div>
              </div>

              {/* What was lost */}
              {selected.lost && (
                <>
                  <CardSection label="WHAT WAS LOST" />
                  <div style={{ padding:"0 22px 16px" }}>
                    <div className="hoverable-dim" style={{
                      fontFamily:plex, fontSize:11, color:C.amberDim,
                      lineHeight:1.9, letterSpacing:"0.02em",
                      textDecoration:"none",
                    }}>
                      {selected.lost}
                    </div>
                  </div>
                </>
              )}

              {/* In use */}
              {selected.usage && (
                <>
                  <CardSection label="IN USE" />
                  <div style={{ padding:"0 22px 18px" }}>
                    <div className="hoverable-dim" style={{
                      fontFamily:plex, fontSize:11, color:C.amberDim,
                      lineHeight:1.9, letterSpacing:"0.02em",
                      textDecoration:"none",
                    }}>
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
              <div className="word-glow" style={{
                fontFamily:serif, fontSize:42, fontWeight:400,
                color:C.amberHot, lineHeight:1, marginBottom:12,
              }}>
                {selected.word}
              </div>
              <div style={{ marginBottom:30 }}>
                <Label style={{ color:C.amberDim }}>/{selected.pronunciation}/</Label>
                <span style={{ margin:"0 10px", color:C.border }}>·</span>
                <Label>{selected.era?.toUpperCase()}</Label>
              </div>
              <Rule style={{ marginBottom:24 }} />
              <div style={{
                fontFamily:plex, fontSize:12.5, color:C.amberBright,
                lineHeight:1.9, marginBottom:32,
                letterSpacing:"0.02em", textDecoration:"none",
              }}>
                {selected.definition}
              </div>
              {selected.lost && (
                <div style={{
                  fontFamily:plex, fontStyle:"normal",
                  fontSize:11, color:C.amberDim, lineHeight:1.9,
                  marginBottom:32, paddingLeft:16, letterSpacing:"0.02em",
                  borderLeft:`2px solid ${C.amberFaint}`,
                  textDecoration:"none",
                }}>
                  {selected.lost}
                </div>
              )}
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <GhostBtn onClick={() => navigator.clipboard?.writeText(`${selected.word} — ${selected.definition}`)}>
                  COPY WORD + DEF
                </GhostBtn>
                <GhostBtn onClick={() => navigator.clipboard?.writeText(selected.definition)}>
                  COPY DEF ONLY
                </GhostBtn>
                <GhostBtn
                  onClick={() => toggleHoard(selected.word)}
                  active={hoards.has(selected.word)}
                >
                  {hoards.has(selected.word) ? "★ HOARDED" : "☆ HOARD"}
                </GhostBtn>
                <GhostBtn onClick={encounter} style={{ marginLeft:"auto" }}>
                  NEXT ›
                </GhostBtn>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM PANEL ────────────────────────────────────────── */}
      <div style={{ borderTop:`1px solid ${C.borderBright}`, background:C.bgPanel }}>
        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:`1px solid ${C.border}` }}>
          {[
            ["cross", "CROSS-POLLINATOR"],
            ["kenn",  "KENNING FORGE"],
            ["hist",  `FORGE LOG${kennHistory.length ? ` [${kennHistory.length}]`:""}`],
            ["hoard", `MY HOARD${hoards.size ? ` [${hoards.size}]`:""}`],
          ].map(([id, label]) => {
            const active = activePanel===id;
            return (
              <button key={id} onClick={() => setActivePanel(id)} style={{
                background:"none", border:"none",
                borderRight:`1px solid ${C.border}`,
                borderBottom: active ? `2px solid ${C.amberGlow}` : "2px solid transparent",
                fontFamily:mono, fontSize:8, letterSpacing:"0.2em",
                color: active ? C.amberGlow : C.textDim,
                padding:"10px 18px", marginBottom:-1,
                textShadow: active ? "0 0 8px rgba(255,175,30,0.7)" : "none",
              }}>{label}</button>
            );
          })}
        </div>

        {/* Cross-pollinator */}
        {activePanel==="cross" && (
          <div style={{ padding:"18px 24px" }}>
            <Brackets style={{ padding:"16px 18px" }} color={C.amberGhost}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <Label style={{ whiteSpace:"nowrap", color:C.amberDim }}>INPUT ›</Label>
                <input
                  placeholder="a modern word or concept"
                  value={crossInput}
                  onChange={e => setCrossInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && transmute()}
                  style={{
                    flex:1, background:"none", border:"none",
                    borderBottom:`1px solid ${C.borderBright}`,
                    color:C.amberGlow, fontFamily:mono,
                    fontSize:11, letterSpacing:"0.1em", padding:"3px 0",
                  }}
                />
                <button onClick={transmute} disabled={crossLoading} style={{
                  background:"none",
                  border:`1px solid ${crossLoading ? C.border : C.borderBright}`,
                  color: crossLoading ? C.textDim : C.amberBright,
                  fontFamily:mono, fontSize:8, letterSpacing:"0.22em",
                  padding:"6px 16px",
                  textShadow: !crossLoading ? "0 0 6px rgba(200,150,10,0.6)" : "none",
                }}>
                  {crossLoading ? "SEEKING..." : "TRANSMUTE"}
                </button>
              </div>
            </Brackets>

            {crossResult && !crossResult.error && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginTop:18 }}>
                {[["oe","ARCHAIC"],["naut","NAUTICAL"],["leg","LEGALISM"]].map(([key,label]) => (
                  <Brackets key={key} style={{ padding:"14px 16px" }} color={C.amberGhost}>
                    <Label style={{ marginBottom:10, display:"block" }}>{label}</Label>
                    <div className="word-glow" style={{
                      fontFamily:serif, fontSize:22, color:C.amberGlow, marginBottom:6,
                    }}>{crossResult[key]?.word}</div>
                    <div style={{
                      fontFamily:serif, fontSize:11, color:C.amberDim,
                      fontStyle:"italic", lineHeight:1.6,
                    }}>{crossResult[key]?.gloss}</div>
                  </Brackets>
                ))}
              </div>
            )}
            {crossResult?.error && (
              <div style={{ fontFamily:serif, fontStyle:"italic", fontSize:11, color:C.textDim, marginTop:14 }}>
                — transmission failed. the signal was lost —
              </div>
            )}
            <div style={{ marginTop:14 }}>
              <Label style={{ fontSize:7, color:C.textGhost }}>
                ↑ ENTER A MODERN WORD · RECEIVE THREE ARCHAIC SHADOWS
              </Label>
            </div>
          </div>
        )}

        {/* Kenning forge */}
        {activePanel==="kenn" && (
          <div style={{ padding:"18px 24px" }}>
            <Brackets style={{ padding:"16px 18px" }} color={C.amberGhost}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <input
                  placeholder="first concept"
                  value={kennA}
                  onChange={e => setKennA(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && forge()}
                  style={{
                    flex:1, background:"none", border:"none",
                    borderBottom:`1px solid ${C.borderBright}`,
                    color:C.amberGlow, fontFamily:mono,
                    fontSize:11, letterSpacing:"0.1em", padding:"3px 0",
                  }}
                />
                <span style={{ fontFamily:serif, fontSize:18, color:C.amberDim }}>+</span>
                <input
                  placeholder="second concept"
                  value={kennB}
                  onChange={e => setKennB(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && forge()}
                  style={{
                    flex:1, background:"none", border:"none",
                    borderBottom:`1px solid ${C.borderBright}`,
                    color:C.amberGlow, fontFamily:mono,
                    fontSize:11, letterSpacing:"0.1em", padding:"3px 0",
                  }}
                />
                <button onClick={forge} disabled={kennLoading} style={{
                  background:"none",
                  border:`1px solid ${kennLoading ? C.border : C.borderBright}`,
                  color: kennLoading ? C.textDim : C.amberBright,
                  fontFamily:mono, fontSize:8, letterSpacing:"0.22em",
                  padding:"6px 16px",
                  textShadow: !kennLoading ? "0 0 6px rgba(200,150,10,0.6)" : "none",
                }}>
                  {kennLoading ? "FORGING..." : "FORGE"}
                </button>
              </div>
            </Brackets>

            {kennResult && !kennResult.error && kennResult.kennings && (
              <div style={{ marginTop:18, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {kennResult.kennings.map((k,i) => (
                  <Brackets key={i} style={{ padding:"14px 16px" }} color={C.amberGhost}>
                    <div className="word-glow" style={{
                      fontFamily:serif, fontSize:22, color:C.amberGlow, marginBottom:4,
                    }}>{k.compound}</div>
                    <div style={{
                      fontFamily:mono, fontSize:8, color:C.amberBright,
                      letterSpacing:"0.16em", marginBottom:8,
                    }}>{k.names?.toUpperCase()}</div>
                    <div style={{
                      fontFamily:serif, fontSize:11, color:C.amberDim,
                      fontStyle:"italic", lineHeight:1.7,
                    }}>{k.logic}</div>
                  </Brackets>
                ))}
              </div>
            )}
            {kennResult?.error && (
              <div style={{ fontFamily:serif, fontStyle:"italic", fontSize:11, color:C.textDim, marginTop:14 }}>
                — the forge went cold. no compound emerged —
              </div>
            )}
            <div style={{ marginTop:14 }}>
              <Label style={{ fontSize:7, color:C.textGhost }}>
                ↑ TWO CONCEPTS ENTER · FOUR KENNINGS EMERGE
              </Label>
            </div>
          </div>
        )}

        {/* Forge log */}
        {activePanel==="hist" && (
          <div style={{ padding:"18px 24px" }}>
            {kennHistory.length===0 && (
              <div style={{ fontFamily:serif, fontStyle:"italic", fontSize:12, color:C.amberGhost, lineHeight:1.8 }}>
                No forgings recorded. The log fills as you work.
              </div>
            )}
            {kennHistory.map((entry,i) => (
              <div key={entry.ts} style={{
                borderBottom:`1px solid ${C.border}`,
                paddingBottom:16, marginBottom:16,
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:12 }}>
                  <span style={{
                    fontFamily:mono, fontSize:9, color:C.amberBright, letterSpacing:"0.18em",
                    textShadow:"0 0 6px rgba(200,150,10,0.5)",
                  }}>
                    {entry.a.toUpperCase()} + {entry.b.toUpperCase()}
                  </span>
                  <button onClick={() => setKennHistory(prev => prev.filter((_,j) => j!==i))} style={{
                    background:"none", border:"none", color:C.textDim,
                    fontFamily:mono, fontSize:7, letterSpacing:"0.14em", padding:0,
                  }}>DISCARD</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 20px" }}>
                  {entry.kennings?.map((k,j) => (
                    <div key={j} style={{ display:"flex", gap:10, alignItems:"baseline" }}>
                      <span style={{ fontFamily:serif, fontSize:15, color:C.amber }}>{k.compound}</span>
                      <span style={{ fontFamily:mono, fontSize:7, color:C.textDim, letterSpacing:"0.08em" }}>— {k.names}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {kennHistory.length>0 && (
              <GhostBtn onClick={() => setKennHistory([])}>CLEAR ALL</GhostBtn>
            )}
          </div>
        )}

        {/* My hoard */}
        {activePanel==="hoard" && (
          <div style={{ padding:"18px 24px" }}>
            {hoards.size===0 && (
              <div style={{ fontFamily:serif, fontSize:13, color:C.amberGhost, fontStyle:"italic", lineHeight:1.8 }}>
                Your hoard is empty. Mark words with ☆ to collect them here.
              </div>
            )}
            {hoards.size>0 && (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12, marginBottom:18 }}>
                  {corpus.filter(w => hoards.has(w.word)).map(w => (
                    <Brackets key={w.word} color={C.amberGhost} style={{
                      padding:"12px 14px", cursor:"pointer",
                      background: selected?.word===w.word ? C.bgSelected : "transparent",
                    }}>
                      <div onClick={() => { selectWord(w); setActiveCat("All"); }}
                        style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                        <div>
                          <div style={{ fontFamily:serif, fontSize:17, color:C.amberGlow, marginBottom:3 }}>{w.word}</div>
                          <Label style={{ fontSize:7 }}>{w.era?.toUpperCase()} · {w.category?.replace("The ","").toUpperCase()}</Label>
                        </div>
                        <button onClick={e => { e.stopPropagation(); toggleHoard(w.word); }} style={{
                          background:"none", border:"none", fontSize:13,
                          color:C.amberGlow, padding:"2px 4px",
                          textShadow:"0 0 6px rgba(255,175,30,0.8)",
                        }}>★</button>
                      </div>
                      <div style={{
                        fontFamily:serif, fontSize:11, color:C.amberDim,
                        lineHeight:1.7, fontStyle:"italic",
                        overflow:"hidden", display:"-webkit-box",
                        WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                      }}>{w.definition}</div>
                    </Brackets>
                  ))}
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <GhostBtn onClick={() => {
                    const text = corpus.filter(w=>hoards.has(w.word)).map(w=>`${w.word}\n${w.definition}\n`).join("\n");
                    navigator.clipboard?.writeText(text);
                  }}>COPY ALL</GhostBtn>
                  <GhostBtn onClick={() => setHoards(new Set())}>CLEAR HOARD</GhostBtn>
                  <Label style={{ marginLeft:10 }}>
                    {hoards.size} {hoards.size===1?"WORD":"WORDS"} HELD
                  </Label>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small reusable buttons ─────────────────────────────────────────────────

function HdrBtn({ children, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      background: active ? "rgba(180,120,10,0.12)" : "none",
      border:"none",
      borderLeft:`1px solid ${C.border}`,
      color: active ? C.amberGlow : C.textDim,
      fontFamily:mono, fontSize:8, letterSpacing:"0.2em",
      padding:"0 16px", height:"100%",
      textShadow: active ? "0 0 8px rgba(255,175,30,0.7)" : "none",
      transition:"color 0.15s",
    }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, active, style }) {
  return (
    <button onClick={onClick} style={{
      background:"none",
      border:`1px solid ${active ? C.amberDim : C.border}`,
      color: active ? C.amberGlow : C.textDim,
      fontFamily:mono, fontSize:8, letterSpacing:"0.18em",
      padding:"5px 14px",
      textShadow: active ? "0 0 6px rgba(255,175,30,0.6)" : "none",
      ...style,
    }}>{children}</button>
  );
}
