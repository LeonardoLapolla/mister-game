/* MISTER · PRO PITCH — Results & EndSeason */
const ED = window.MISTER_DATA;

function StandList({ rows }){
  return (
    <div className="std">
      <div className="std-h"><span>#</span><span>Squadra</span><span>G</span><span>Pt</span></div>
      {rows.map((r,i)=>(
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

const COMP_NAME = { ch:'Champions League', el:'Europa League', co:'Conference League' };

/* ===== RESULTS ===== */
function ResultsScreen({ teamName, season, onNext }){
  const you = ED.finalStandings.find(r=>r.you) || {};
  const res = ED.seasonResults[season-1] || ED.seasonResults[0];
  const zoneClass = res.comp;
  return (
    <div className="stack fade-key" style={{flex:1,minHeight:0}}>
      <div className="tr-head"><p className="kicker">Classifica finale · 38ª · Stagione {season}</p><h2 className="h-display" style={{fontSize:30}}>Fine campionato</h2></div>
      <div className="screen-scroll">
        <div className={`finish-card ${zoneClass}`}>
          <div className="finish-pos">{res.pos}</div>
          <div className="finish-info">
            <b>{teamName}</b>
            <span>{res.pt} punti · qualificata {res.compName}</span>
          </div>
          <div className="finish-score">
            <span>Punteggio stagione</span>
            <b>{res.score.toLocaleString('it-IT')}</b>
          </div>
        </div>
        <StandList rows={ED.finalStandings}/>
        <div style={{height:14}}></div>
      </div>
      <div className="screen-foot">
        <button className="btn primary" onClick={onNext}>Fine stagione ▸</button>
      </div>
    </div>
  );
}

/* ===== END SEASON ===== */
function EndSeasonScreen({ teamName, season, onSummerMarket, onNewSeason, onEuropa }){
  const res = ED.seasonResults[season-1] || ED.seasonResults[0];
  const storico = ED.seasonResults.slice(0, season).map((r,i)=>({ season:'Stagione '+(i+1), ...r }));
  const isLast = season >= ED.seasonResults.length;
  return (
    <div className="stack fade-key" style={{flex:1,minHeight:0}}>
      <div className="tr-head"><p className="kicker">Riepilogo</p><h2 className="h-display" style={{fontSize:30}}>Fine Stagione {season}</h2></div>
      <div className="screen-scroll">
        {/* score recap */}
        <div className="recap-card">
          <span className="recap-k">Punteggio stagione</span>
          <b className="recap-n">{res.score.toLocaleString('it-IT')}</b>
          <span className="recap-sub">{teamName} · {res.pos} posto · {res.pt} punti</span>
        </div>

        {/* european qualification ticket */}
        <div className="section-title">Qualificazione europea</div>
        <button className={`euro-ticket ${res.comp}`} onClick={()=>onEuropa(res.comp)}>
          <div className="euro-l">
            <span className="euro-badge">{res.compName}</span>
            <b>Sei qualificato!</b>
            <span className="euro-sub">{res.pos} posto · fase a girone unico</span>
          </div>
          <span className="euro-go">Entra ▸</span>
        </button>

        {/* history */}
        <div className="section-title">Storico stagioni</div>
        <div className="roster" style={{paddingTop:4}}>
          {storico.map((h,i)=>(
            <div key={i} className="hist-row">
              <span className="hist-s">{h.season}</span>
              <span className={`hist-comp ${h.comp}`}></span>
              <span className="hist-pos">{h.pos}</span>
              <span className="hist-pt">{h.pt} pt</span>
              <span className="hist-score">{h.score.toLocaleString('it-IT')}</span>
            </div>
          ))}
        </div>
        <div style={{height:14}}></div>
      </div>
      <div className="screen-foot">
        <div className="btn-row">
          <button className="btn dark" style={{flex:1}} onClick={onSummerMarket}>Mercato estivo</button>
          <button className="btn primary" style={{flex:1}} onClick={onNewSeason}>
            {isLast ? 'Riepilogo finale ▸' : 'Nuova stagione ▸'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== INTER-SEASON (transizione fra stagioni) ===== */
function InterSeasonScreen({ teamName, season, onStart }){
  const prev = ED.seasonResults[season-2];   // stagione appena conclusa
  const cur  = ED.seasonResults[season-1] || ED.seasonResults[ED.seasonResults.length-1];
  return (
    <div className="stack fade-key inter" style={{flex:1,minHeight:0}}>
      <div className="inter-bg" aria-hidden="true"></div>
      <div className="screen-scroll" style={{position:'relative',zIndex:2}}>
        <div className="inter-hero">
          <span className="inter-kick anim-up" style={{'--d':'.05s'}}>La nuova annata</span>
          <h1 className="inter-title anim-up" style={{'--d':'.15s'}}>Stagione {season}</h1>
          <span className="inter-team anim-up" style={{'--d':'.25s'}}>{teamName}</span>
        </div>

        {prev && (
          <div className="inter-card anim-up" style={{'--d':'.36s'}}>
            <span className="inter-card-k">La scorsa stagione</span>
            <div className="inter-prev">
              <span className={`inter-medal ${prev.comp}`}>{prev.pos}</span>
              <div className="inter-prev-tx">
                <b>{prev.pt} punti</b>
                <span>Qualificato {prev.compName}</span>
              </div>
            </div>
          </div>
        )}

        <div className="inter-obj anim-up" style={{'--d':'.46s'}}>
          <span className="inter-card-k">Obiettivo del club</span>
          <b>{cur.obj}</b>
        </div>

        <div style={{height:10}}></div>
      </div>
      <div className="screen-foot" style={{position:'relative',zIndex:2}}>
        <button className="btn primary cta-shine" onClick={onStart}>Inizia Stagione {season} ▸</button>
      </div>
    </div>
  );
}

/* ===== FINAL RECAP (fine carriera, dopo 3 stagioni) ===== */
function FinalRecapScreen({ teamName, onRestart }){
  const total = ED.seasonResults.reduce((s,r)=>s+r.score,0);
  const best = ED.seasonResults.reduce((b,r)=>r.posN<b.posN?r:b, ED.seasonResults[0]);
  const euroCount = ED.seasonResults.filter(r=>r.comp).length;
  return (
    <div className="stack fade-key final" style={{flex:1,minHeight:0}}>
      <div className="final-bg" aria-hidden="true"></div>
      <div className="screen-scroll" style={{position:'relative',zIndex:2}}>
        <div className="final-hero">
          <span className="inter-kick anim-up" style={{'--d':'.05s'}}>Carriera completata</span>
          <span className="final-cup anim-up" style={{'--d':'.14s'}}></span>
          <span className="final-k anim-up" style={{'--d':'.3s'}}>Punteggio totale</span>
          <b className="final-total anim-up" style={{'--d':'.36s'}}>{total.toLocaleString('it-IT')}</b>
          <span className="final-team anim-up" style={{'--d':'.46s'}}>{teamName} · 3 stagioni</span>
        </div>

        <div className="final-stats anim-up" style={{'--d':'.54s'}}>
          <div className="fs"><b>{best.pos}</b><span>Miglior piazz.</span></div>
          <div className="fs"><b>{euroCount}</b><span>Qualif. Europa</span></div>
          <div className="fs"><b>3</b><span>Stagioni</span></div>
        </div>

        <div className="section-title">Percorso</div>
        <div className="roster" style={{paddingTop:4}}>
          {ED.seasonResults.map((h,i)=>(
            <div key={i} className="hist-row">
              <span className="hist-s">Stagione {i+1}</span>
              <span className={`hist-comp ${h.comp}`}></span>
              <span className="hist-pos">{h.pos}</span>
              <span className="hist-pt">{h.pt} pt</span>
              <span className="hist-score">{h.score.toLocaleString('it-IT')}</span>
            </div>
          ))}
        </div>

        <div className="section-title">Rosa finale</div>
        <div className="roster">
          {ED.lineup.map((p,i)=>(
            <div key={i} className="rrow">
              <span className="num">{p.num}</span>
              <span className="role">{p.role}</span>
              <span className="nm">{p.n}</span>
              <span className="ovr" style={{color: p.ovr>=86?'var(--primary)':'var(--ink)'}}>{p.ovr}</span>
            </div>
          ))}
        </div>
        <div style={{height:14}}></div>
      </div>
      <div className="screen-foot" style={{position:'relative',zIndex:2}}>
        <button className="btn primary cta-shine" onClick={onRestart}>Nuova partita ▸</button>
      </div>
    </div>
  );
}

Object.assign(window, { ResultsScreen, EndSeasonScreen, InterSeasonScreen, FinalRecapScreen, StandList });
