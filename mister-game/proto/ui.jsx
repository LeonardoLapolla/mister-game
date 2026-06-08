/* MISTER · PRO PITCH prototype — screens */
const { useState, useEffect, useRef, useCallback } = React;
const D = window.MISTER_DATA;

/* ---------- StatusBar ---------- */
function StatusBar(){
  return (
    <div className="statusbar">
      <span>9:41</span>
      <span style={{fontFamily:'var(--font-display)',textTransform:'uppercase',letterSpacing:'.18em',fontSize:12,color:'var(--primary)'}}>MISTER</span>
      <span className="dots"><i></i><i></i><i></i></span>
    </div>
  );
}

/* ---------- Event icons (3 bonus + 3 malus) ---------- */
const ICON_PATHS = {
  // bonus
  flame: "M13.6 2.2c.5 3.1-1.6 4.4-2.9 5.8C9.4 9.4 8 11 8 13.6 8 17.3 10.7 20 14 20c3.6 0 6-2.8 6-6.4 0-2.5-1.2-4.8-2.9-6.3.3 1.5-.2 2.7-1.3 3.4.7-2.6-.6-5.6-2.2-7.5z",
  crowd: "M4 9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v3a1 1 0 0 0 2 0v-3l11 4a1 1 0 0 0 1.3-.95V5.95A1 1 0 0 0 18 5L7 9H4z",
  star:  "M12 2l2.9 6.1 6.6.9-4.8 4.7 1.2 6.6L12 18.1 6.1 20.3l1.2-6.6L2.5 9l6.6-.9L12 2z",
  // malus
  injury:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1.6 5v3.4H17v2.2h-3.4V16h-2.2v-3.4H8v-2.2h3.4V7z",
  card:  "M9 2.4 6 18.2a1 1 0 0 0 .8 1.16l5.9 1.1a1 1 0 0 0 1.17-.8L17 3.86a1 1 0 0 0-.8-1.16l-5.9-1.1A1 1 0 0 0 9 2.4z",
  fatigue:"M3 8a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H3zm1.8 2H8v4H4.8a.8.8 0 0 1-.8-.8v-2.4a.8.8 0 0 1 .8-.8zM21 10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1z"
};
function Icon({ name, size=20 }){
  const d = ICON_PATHS[name];
  if(!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d}></path>
    </svg>
  );
}

/* ---------- Wheel React wrapper ---------- */
function Wheel({ segments, onResult, glow }){
  const ref = useRef(null);
  const api = useRef(null);
  useEffect(()=>{
    if(ref.current && window.ProtoWheel){
      api.current = window.ProtoWheel.mount(ref.current, { segments, glow, onResult });
    }
  },[]);
  // redraw if segments change
  useEffect(()=>{
    if(api.current){ api.current.segs = segments; api.current.draw(); }
  },[segments]);
  return <canvas className="proto-wheel" ref={ref}></canvas>;
}

/* ---------- Standings list ---------- */
function Standings(){
  return (
    <div className="std">
      <div className="std-h"><span>#</span><span>Squadra</span><span>G</span><span>Pt</span></div>
      {D.standings.map((r,i)=>(
        <div key={i} className={`std-row ${r.zone} ${r.you?'you':''}`}>
          <span className="z"></span>
          <span className="pos">{r.pos}</span>
          <span className="tm"><span className="mc" style={r.you?{background:'var(--primary)'}:{}}></span>{r.tm}</span>
          <span className="g">{r.g}</span>
          <span className="pt">{r.pt}</span>
        </div>
      ))}
      <div className="std-legend">
        <span><i style={{background:'var(--champions)'}}></i>Champions</span>
        <span><i style={{background:'var(--europa)'}}></i>Europa</span>
        <span><i style={{background:'var(--conference)'}}></i>Conference</span>
        <span><i style={{background:'var(--loss)'}}></i>Retroc.</span>
      </div>
    </div>
  );
}

/* ---------- Drawer (live standings) ---------- */
function Drawer({ open, onClose }){
  if(!open) return null;
  return (
    <div className="drawer-wrap">
      <div className="drawer-scrim" onClick={onClose}></div>
      <div className="drawer">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 18px 12px'}}>
          <div>
            <p className="kicker">Live</p>
            <h2 className="h-display" style={{fontSize:26}}>Classifica</h2>
          </div>
          <button className="btn dark btn-sm" onClick={onClose}>Chiudi</button>
        </div>
        <div style={{flex:1,overflowY:'auto'}}><Standings/></div>
      </div>
    </div>
  );
}

/* ---------- Result overlay banner ---------- */
function ResultOverlay({ data, onClose }){
  if(!data) return null;
  const cls = data.kind; // win/draw/loss
  const word = cls==='win'?'Vittoria':cls==='draw'?'Pareggio':'Sconfitta';
  const bk = cls==='win'?'W':cls==='draw'?'D':'L';
  return (
    <div className="overlay" onClick={onClose}>
      <div className={`result-banner ${cls}`}>
        <span className="bk">{bk}</span>
        <div className="res">{word}</div>
        <div className="vs">{data.home} &nbsp;vs&nbsp; {data.opp}</div>
        <div className="score">{data.score}</div>
        <button className="btn primary" style={{marginTop:22}} onClick={onClose}>Continua</button>
      </div>
    </div>
  );
}

window.MisterUI = { StatusBar, Wheel, Standings, Drawer, ResultOverlay, Icon };
