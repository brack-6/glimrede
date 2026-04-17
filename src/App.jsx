import { useState, useCallback, useEffect } from "react";

const CATEGORIES = [
  "All",
  "The Luminous", "The Dark", "The Wandering", "The Reckoning",
  "The Speaking", "The Spent", "The Sounding", "The Knowing",
  "The Bodied", "The Bound",
];

const C = {
  bg: "#111009", bgPanel: "#161410", bgHover: "#1e1b14", bgSelected: "#231f17",
  amber: "#b87d10", amberBright: "#d4940e", amberGlow: "#e8a820",
  amberDim: "#6e4c08", amberFaint: "#2e2008",
  border: "#2e2510", borderBright: "#4a3a14",
  textDim: "#5a3e08", textMuted: "#332510",
};

const mono = "'Courier New', 'Courier', monospace";
const serif = "Georgia, 'Times New Roman', serif";

const scanlines = {
  background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)`,
  position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100, opacity: 0.4,
};

const HOARD_KEY = "glimrede-saved-words";

export default function Glimrede() {
  const [corpus, setCorpus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [writerMode, setWriterMode] = useState(false);
  const [encounterFlash, setEncounterFlash] = useState(false);

  const [crossInput, setCrossInput] = useState("");
  const [crossResult, setCrossResult] = useState(null);
  const [crossLoading, setCrossLoading] = useState(false);

  const [kennA, setKennA] = useState("");
  const [kennB, setKennB] = useState("");
  const [kennResult, setKennResult] = useState(null);
  const [kennLoading, setKennLoading] = useState(false);
  const [kennHistory, setKennHistory] = useState([]);
  const [activePanel, setActivePanel] = useState("cross");

  const [hoards, setHoards] = useState(new Set());

  useEffect(() => {
    fetch("/words.json")
      .then(r => r.json())
      .then(data => {
        setCorpus(data);
        // Pick a random starting word
        const ERA_WEIGHT = { "Old English": 3, "Middle English": 3, "Early Modern English": 2 };
        const weighted = data.flatMap(w => Array(ERA_WEIGHT[w.era] || 1).fill(w));
        setSelected(weighted[Math.floor(Math.random() * weighted.length)] || data[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HOARD_KEY);
      if (saved) setHoards(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HOARD_KEY, JSON.stringify([...hoards]));
    } catch {}
  }, [hoards]);

  const toggleHoard = useCallback((word) => {
    setHoards(prev => {
      const next = new Set(prev);
      next.has(word) ? next.delete(word) : next.add(word);
      return next;
    });
  }, []);

  const encounter = useCallback(() => {
    if (!corpus.length) return;
    const ERA_WEIGHT = { "Old English": 3, "Middle English": 3, "Early Modern English": 2 };
    const pool = corpus.filter(w => w !== selected);
    const weighted = pool.flatMap(w => Array(ERA_WEIGHT[w.era] || 1).fill(w));
    const pick = weighted[Math.floor(Math.random() * weighted.length)];
    setSelected(pick);
    setActiveCategory("All");
    setSearch("");
    setEncounterFlash(true);
    setTimeout(() => setEncounterFlash(false), 600);
  }, [corpus, selected]);

  const filtered = corpus.filter(w => {
    const q = search.toLowerCase();
    const matchSearch = !q || w.word.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q) || w.category?.toLowerCase().includes(q);
    const matchCat = activeCategory === "All" || w.category === activeCategory;
    return matchSearch && matchCat;
  });

  const transmute = useCallback(async () => {
    if (!crossInput.trim() || crossLoading) return;
    setCrossLoading(true);
    setCrossResult(null);
    try {
      const res = await fetch("/api/transmute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: crossInput.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCrossResult(data);
    } catch { setCrossResult({ error: true }); }
    setCrossLoading(false);
  }, [crossInput, crossLoading]);

  const forge = useCallback(async () => {
    if (!kennA.trim() || !kennB.trim() || kennLoading) return;
    setKennLoading(true);
    setKennResult(null);
    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: kennA.trim(), b: kennB.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setKennResult(data);
      setKennHistory(prev => [{ a: kennA.trim(), b: kennB.trim(), kennings: data.kennings, ts: Date.now() }, ...prev].slice(0, 20));
    } catch { setKennResult({ error: true }); }
    setKennLoading(false);
  }, [kennA, kennB, kennLoading]);

  if (loading) return (
    <div style={{ background: C.bg, color: C.amberDim, fontFamily: mono, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, letterSpacing: "0.3em" }}>
      LOADING CORPUS...
    </div>
  );

  return (
    <div style={{ background: C.bg, color: C.amber, fontFamily: mono, minHeight: "100vh", position: "relative" }}>
      <div style={scanlines} />

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontSize: 13, letterSpacing: "0.3em", color: C.amberGlow }}>GLIMREDE</span>
          <span style={{ fontSize: 8, color: C.textDim, letterSpacing: "0.18em" }}>A THESAURUS OF LOST LANGUAGE</span>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={encounter} style={{ background: "none", border: `1px solid ${C.borderBright}`, color: C.amberBright, fontFamily: mono, fontSize: 8, letterSpacing: "0.22em", cursor: "pointer", padding: "4px 12px" }}>ENCOUNTER</button>
          <button onClick={() => setWriterMode(m => !m)} style={{ background: writerMode ? C.amberFaint : "none", border: `1px solid ${writerMode ? C.amberDim : C.border}`, color: writerMode ? C.amberGlow : C.textDim, fontFamily: mono, fontSize: 8, letterSpacing: "0.22em", cursor: "pointer", padding: "4px 12px" }}>{writerMode ? "WRITER ◉" : "WRITER ○"}</button>
          <span style={{ fontSize: 9, color: C.textDim, letterSpacing: "0.18em" }}>{corpus.length} ENTRIES</span>
        </div>
      </div>

      {/* Category strip */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "7px 20px", display: "flex", gap: 20, overflowX: "auto", scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{ background: "none", border: "none", borderBottom: activeCategory === cat ? `1px solid ${C.amberGlow}` : "1px solid transparent", cursor: "pointer", fontFamily: mono, fontSize: 9, letterSpacing: "0.15em", color: activeCategory === cat ? C.amberGlow : C.textDim, padding: "2px 0", whiteSpace: "nowrap" }}>
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", minHeight: "calc(100vh - 200px)" }}>

        {/* Word list */}
        <div style={{ borderRight: `1px solid ${C.border}` }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
            <input placeholder="SEEK_" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", background: "none", border: "none", borderBottom: `1px solid ${C.borderBright}`, color: C.amberGlow, fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", outline: "none", padding: "3px 0", boxSizing: "border-box" }} />
          </div>
          <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
            {filtered.length === 0 && <div style={{ padding: "16px 14px", fontSize: 10, color: C.textDim }}>NO MATCH FOUND</div>}
            {filtered.map(w => (
              <div key={w.word} onClick={() => setSelected(w)} style={{ padding: "9px 14px", cursor: "pointer", background: selected?.word === w.word ? C.bgSelected : "transparent", borderBottom: `1px solid ${C.amberFaint}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: selected?.word === w.word ? C.amberGlow : C.amber, fontFamily: serif }}>{w.word}</div>
                  <div style={{ fontSize: 8, color: C.textDim, letterSpacing: "0.1em", marginTop: 2 }}>{w.category?.toUpperCase()}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); toggleHoard(w.word); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", fontSize: 12, color: hoards.has(w.word) ? C.amberGlow : C.amberFaint, lineHeight: 1, flexShrink: 0 }}>
                  {hoards.has(w.word) ? "★" : "☆"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Entry panel */}
        <div style={{ padding: writerMode ? "40px 48px" : "26px 30px", overflowY: "auto", transition: "background 0.3s", background: encounterFlash ? C.amberFaint : "transparent" }}>
          {selected && !writerMode && (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 5 }}>
                <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 400, color: C.amberGlow, letterSpacing: "0.01em" }}>{selected.word}</div>
                <button onClick={() => toggleHoard(selected.word)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 18, color: hoards.has(selected.word) ? C.amberGlow : C.amberFaint, lineHeight: 1 }}>
                  {hoards.has(selected.word) ? "★" : "☆"}
                </button>
              </div>
              <div style={{ fontSize: 9, color: C.textDim, letterSpacing: "0.18em", marginBottom: 22 }}>/{selected.pronunciation}/ · {selected.era?.toUpperCase()} · {selected.category?.toUpperCase()}</div>
              <div style={{ fontFamily: serif, fontSize: 14, color: C.amber, lineHeight: 1.8, marginBottom: 28 }}>{selected.definition}</div>
              {selected.lost && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18, marginBottom: 26 }}>
                  <div style={{ fontSize: 8, letterSpacing: "0.22em", color: C.textDim, marginBottom: 10 }}>WHAT WAS LOST</div>
                  <div style={{ fontFamily: serif, fontSize: 13, color: C.amberDim, lineHeight: 1.75, fontStyle: "italic" }}>{selected.lost}</div>
                </div>
              )}
              {selected.usage && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
                  <div style={{ fontSize: 8, letterSpacing: "0.22em", color: C.textDim, marginBottom: 10 }}>IN USE</div>
                  <div style={{ fontFamily: serif, fontSize: 13, color: C.amberDim, lineHeight: 1.75 }}>"{selected.usage}"</div>
                </div>
              )}
            </>
          )}
          {selected && writerMode && (
            <div style={{ maxWidth: 480 }}>
              <div style={{ fontFamily: serif, fontSize: 42, fontWeight: 400, color: C.amberGlow, marginBottom: 10 }}>{selected.word}</div>
              <div style={{ fontSize: 8, color: C.textDim, letterSpacing: "0.2em", marginBottom: 28 }}>/{selected.pronunciation}/ · {selected.era?.toUpperCase()}</div>
              <div style={{ fontFamily: serif, fontSize: 15, color: C.amber, lineHeight: 1.9, marginBottom: 32 }}>{selected.definition}</div>
              {selected.lost && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 22, marginBottom: 28 }}>
                  <div style={{ fontFamily: serif, fontSize: 13, color: C.amberDim, lineHeight: 1.8, fontStyle: "italic" }}>{selected.lost}</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => navigator.clipboard?.writeText(`${selected.word} — ${selected.definition}`)} style={{ background: "none", border: `1px solid ${C.borderBright}`, color: C.amberBright, fontFamily: mono, fontSize: 8, letterSpacing: "0.18em", cursor: "pointer", padding: "5px 14px" }}>COPY WORD + DEF</button>
                <button onClick={() => navigator.clipboard?.writeText(selected.definition)} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textDim, fontFamily: mono, fontSize: 8, letterSpacing: "0.18em", cursor: "pointer", padding: "5px 14px" }}>COPY DEF ONLY</button>
                <button onClick={() => toggleHoard(selected.word)} style={{ background: "none", border: `1px solid ${C.border}`, color: hoards.has(selected.word) ? C.amberGlow : C.textDim, fontFamily: mono, fontSize: 8, letterSpacing: "0.18em", cursor: "pointer", padding: "5px 14px" }}>{hoards.has(selected.word) ? "★ HOARDED" : "☆ HOARD"}</button>
                <button onClick={encounter} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textDim, fontFamily: mono, fontSize: 8, letterSpacing: "0.18em", cursor: "pointer", padding: "5px 14px", marginLeft: "auto" }}>NEXT ›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom panels */}
      <div style={{ borderTop: `1px solid ${C.border}`, background: C.bgPanel }}>
        <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex" }}>
          {[["cross", "CROSS-POLLINATOR"], ["kenn", "KENNING FORGE"], ["hist", `FORGE LOG${kennHistory.length ? ` (${kennHistory.length})` : ""}`], ["hoard", `MY HOARD${hoards.size ? ` (${hoards.size})` : ""}`]].map(([id, label]) => (
            <button key={id} onClick={() => setActivePanel(id)} style={{ background: "none", border: "none", borderRight: `1px solid ${C.border}`, borderBottom: activePanel === id ? `2px solid ${C.amberGlow}` : "2px solid transparent", cursor: "pointer", fontFamily: mono, fontSize: 8, letterSpacing: "0.22em", color: activePanel === id ? C.amberGlow : C.textDim, padding: "10px 20px", marginBottom: -1 }}>{label}</button>
          ))}
        </div>

        {activePanel === "cross" && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: crossResult ? 20 : 0 }}>
              <input placeholder="enter a modern word or concept" value={crossInput} onChange={e => setCrossInput(e.target.value)} onKeyDown={e => e.key === "Enter" && transmute()}
                style={{ flex: 1, background: "none", border: "none", borderBottom: `1px solid ${C.borderBright}`, color: C.amberGlow, fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", outline: "none", padding: "4px 0" }} />
              <button onClick={transmute} disabled={crossLoading} style={{ background: "none", border: `1px solid ${C.borderBright}`, color: crossLoading ? C.textDim : C.amberBright, fontFamily: mono, fontSize: 8, letterSpacing: "0.22em", cursor: crossLoading ? "default" : "pointer", padding: "5px 14px" }}>
                {crossLoading ? "SEEKING..." : "TRANSMUTE"}
              </button>
            </div>
            {crossResult && !crossResult.error && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 20 }}>
                {[["oe", "ARCHAIC"], ["naut", "NAUTICAL"], ["leg", "LEGALISM"]].map(([key, label]) => (
                  <div key={key} style={{ borderLeft: `2px solid ${C.amberFaint}`, paddingLeft: 14 }}>
                    <div style={{ fontSize: 8, letterSpacing: "0.18em", color: C.textDim, marginBottom: 7 }}>{label}</div>
                    <div style={{ fontFamily: serif, fontSize: 19, color: C.amberGlow, marginBottom: 5 }}>{crossResult[key]?.word}</div>
                    <div style={{ fontFamily: serif, fontSize: 11, color: C.amberDim, fontStyle: "italic", lineHeight: 1.5 }}>{crossResult[key]?.gloss}</div>
                  </div>
                ))}
              </div>
            )}
            {crossResult?.error && <div style={{ fontSize: 10, color: C.textDim, marginTop: 8, fontStyle: "italic" }}>transmission failed — the signal was lost.</div>}
            <div style={{ marginTop: 14, fontSize: 8, color: C.textMuted, letterSpacing: "0.12em" }}>↑ TYPE A MODERN WORD · RECEIVE ITS THREE ARCHAIC SHADOWS</div>
          </div>
        )}

        {activePanel === "kenn" && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 6 }}>
              <input placeholder="first concept" value={kennA} onChange={e => setKennA(e.target.value)} onKeyDown={e => e.key === "Enter" && forge()}
                style={{ flex: 1, background: "none", border: "none", borderBottom: `1px solid ${C.borderBright}`, color: C.amberGlow, fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", outline: "none", padding: "4px 0" }} />
              <span style={{ color: C.amberDim, fontFamily: serif, fontSize: 18, paddingBottom: 2 }}>+</span>
              <input placeholder="second concept" value={kennB} onChange={e => setKennB(e.target.value)} onKeyDown={e => e.key === "Enter" && forge()}
                style={{ flex: 1, background: "none", border: "none", borderBottom: `1px solid ${C.borderBright}`, color: C.amberGlow, fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", outline: "none", padding: "4px 0" }} />
              <button onClick={forge} disabled={kennLoading} style={{ background: "none", border: `1px solid ${C.borderBright}`, color: kennLoading ? C.textDim : C.amberBright, fontFamily: mono, fontSize: 8, letterSpacing: "0.22em", cursor: kennLoading ? "default" : "pointer", padding: "5px 14px" }}>
                {kennLoading ? "FORGING..." : "FORGE"}
              </button>
            </div>
            {kennResult && !kennResult.error && kennResult.kennings && (
              <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                {kennResult.kennings.map((k, i) => (
                  <div key={i} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <div style={{ fontFamily: serif, fontSize: 21, color: C.amberGlow, marginBottom: 4 }}>{k.compound}</div>
                    <div style={{ fontSize: 9, color: C.amberBright, letterSpacing: "0.14em", marginBottom: 7 }}>{k.names?.toUpperCase()}</div>
                    <div style={{ fontFamily: serif, fontSize: 11, color: C.amberDim, lineHeight: 1.65, fontStyle: "italic" }}>{k.logic}</div>
                  </div>
                ))}
              </div>
            )}
            {kennResult?.error && <div style={{ fontSize: 10, color: C.textDim, marginTop: 8, fontStyle: "italic" }}>the forge went cold — no signal returned.</div>}
            <div style={{ marginTop: 14, fontSize: 8, color: C.textMuted, letterSpacing: "0.12em" }}>↑ TWO CONCEPTS ENTER · FOUR KENNINGS EMERGE</div>
          </div>
        )}

        {activePanel === "hist" && (
          <div style={{ padding: "16px 20px" }}>
            {kennHistory.length === 0 && <div style={{ fontSize: 10, color: C.textDim, fontStyle: "italic", fontFamily: serif }}>No forgings yet. The log fills as you work.</div>}
            {kennHistory.map((entry, i) => (
              <div key={entry.ts} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 18, marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <span style={{ fontFamily: mono, fontSize: 9, color: C.amberBright, letterSpacing: "0.14em" }}>{entry.a.toUpperCase()} + {entry.b.toUpperCase()}</span>
                  <button onClick={() => setKennHistory(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.textDim, fontFamily: mono, fontSize: 8, cursor: "pointer", letterSpacing: "0.1em", padding: 0 }}>DISCARD</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                  {entry.kennings?.map((k, j) => (
                    <div key={j} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                      <span style={{ fontFamily: serif, fontSize: 15, color: C.amber, whiteSpace: "nowrap" }}>{k.compound}</span>
                      <span style={{ fontFamily: mono, fontSize: 8, color: C.textDim, letterSpacing: "0.08em" }}>— {k.names}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {kennHistory.length > 0 && <button onClick={() => setKennHistory([])} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textDim, fontFamily: mono, fontSize: 8, letterSpacing: "0.18em", cursor: "pointer", padding: "5px 14px", marginTop: 4 }}>CLEAR ALL</button>}
          </div>
        )}

        {activePanel === "hoard" && (
          <div style={{ padding: "16px 20px" }}>
            {hoards.size === 0 && <div style={{ fontFamily: serif, fontSize: 13, color: C.amberDim, fontStyle: "italic", lineHeight: 1.8 }}>Your hoard is empty. Mark words with ☆ to collect them here.</div>}
            {hoards.size > 0 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
                  {corpus.filter(w => hoards.has(w.word)).map(w => (
                    <div key={w.word} style={{ border: `1px solid ${C.border}`, padding: "14px 16px", cursor: "pointer", background: selected?.word === w.word ? C.bgSelected : C.bgPanel }} onClick={() => { setSelected(w); setActiveCategory("All"); }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontFamily: serif, fontSize: 18, color: C.amberGlow, marginBottom: 3 }}>{w.word}</div>
                          <div style={{ fontSize: 8, color: C.textDim, letterSpacing: "0.14em" }}>{w.era?.toUpperCase()} · {w.category?.toUpperCase()}</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); toggleHoard(w.word); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.amberGlow, padding: "2px 4px", lineHeight: 1 }}>★</button>
                      </div>
                      <div style={{ fontFamily: serif, fontSize: 11, color: C.amberDim, lineHeight: 1.7, fontStyle: "italic", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {w.definition}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button onClick={() => { const text = corpus.filter(w => hoards.has(w.word)).map(w => `${w.word}\n${w.definition}\n`).join("\n"); navigator.clipboard?.writeText(text); }} style={{ background: "none", border: `1px solid ${C.borderBright}`, color: C.amberBright, fontFamily: mono, fontSize: 8, letterSpacing: "0.18em", cursor: "pointer", padding: "5px 14px" }}>COPY ALL</button>
                  <button onClick={() => setHoards(new Set())} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textDim, fontFamily: mono, fontSize: 8, letterSpacing: "0.18em", cursor: "pointer", padding: "5px 14px" }}>CLEAR HOARD</button>
                  <span style={{ fontSize: 8, color: C.textDim, letterSpacing: "0.12em", marginLeft: 8 }}>{hoards.size} {hoards.size === 1 ? "WORD" : "WORDS"} HELD</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
