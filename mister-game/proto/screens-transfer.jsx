/* MISTER · DEADLINE DAY — Transfer (mercato) flow
   A live-broadcast restyle: countdown to deadline, on-air wheel,
   breaking-news confirmations and a rolling rumour ticker.
   mode: 'gennaio' (parte da Sì/No) | 'estate' (parte dal budget)
   props: { mode, teamName, onDone(acquisti[]) }
*/
const { useState: tS } = React;
const TD = window.MISTER_DATA;

/* ---- live broadcast bar: LIVE dot + countdown to deadline ---- */
function DeadlineBar({ heading }){
  const [clock, setClock] = tS(3*3600 - 17);      // ~3h to the gong
  React.useEffect(()=>{
    const t = setInterval(()=> setClock(c => c>0 ? c-1 : 0), 1000);
    return ()=> clearInterval(t);
  }, []);
  const hh = String(Math.floor(clock/3600)).padStart(2,'0');
  const mm = String(Math.floor((clock%3600)/60)).padStart(2,'0');
  const ss = String(clock%60).padStart(2,'0');
  const urgent = clock < 1800;                     // last 30' → red
  return (
    <div className={`mkt-bar ${urgent?'urgent':''}`}>
      <span className="mkt-live"><i></i>LIVE</span>
      <span className="mkt-bar-title">{heading}</span>
      <span className="mkt-clock">
        <span className="mkt-clock-k">Gong</span>
        <b>{hh}:{mm}:{ss}</b>
      </span>
    </div>
  );
}

/* ---- rolling rumour ticker pinned to the bottom ---- */
function NewsTicker(){
  const news = TD.tickerNews || [];
  return (
    <div className="mkt-ticker">
      <span className="mkt-ticker-tag"><i></i>Ultim'ora</span>
      <div className="mkt-ticker-view">
        <div className="mkt-ticker-run">
          {news.map((t,i)=><span key={i}>{t}</span>)}
          {news.map((t,i)=><span key={'b'+i}>{t}</span>)}
        </div>
      </div>
    </div>
  );
}

function TransferFlow({ mode, teamName, onDone }){
  const { Wheel } = window.MisterUI;
  const [stage, setStage]   = tS(mode === 'gennaio' ? 'ask' : 'budget');
  const [budget, setBudget] = tS(null);
  const [count, setCount]   = tS(1);
  const [acqIdx, setAcqIdx] = tS(0);
  const [cur, setCur]       = tS({});
  const [doneList, setDone] = tS([]);
  const [picked, setPicked] = tS(null);
  const [spun, setSpun]     = tS(false);

  const playerPool = (roleKey) =>
    (TD.players[roleKey] || []).map(p => ({ label:p.n, sub:'OVR '+p.ovr, color:p.c, ovr:p.ovr }));
  const replacePool = (roleKey) =>
    TD.lineup.filter(p => p.role === roleKey).map((p,i) => ({ label:p.n, sub:'OVR '+p.ovr, color:i%2?'#13261E':'#0FA56C', ovr:p.ovr }));

  const segsFor = () => {
    switch(stage){
      case 'ask':    return TD.yesno;
      case 'budget': return TD.transferBudgets;
      case 'count':  return TD.acquistiCounts;
      case 'league': return TD.leagues;
      case 'role':   return TD.roles;
      case 'player': return playerPool(cur.roleKey);
      case 'replace':return replacePool(cur.roleKey);
      default: return [];
    }
  };
  // [lower-third label, headline]
  const promptFor = () => {
    const a = `Trattativa ${acqIdx+1} di ${count||1}`;
    switch(stage){
      case 'ask':    return ['Si apre il mercato', 'Apri la sessione di gennaio?'];
      case 'budget': return ['Tesoretto', 'Budget a disposizione'];
      case 'count':  return ['Piano mercato', 'Quanti colpi vuoi piazzare?'];
      case 'league': return [a, 'Da quale campionato peschi?'];
      case 'role':   return [a, 'Quale reparto rinforzi?'];
      case 'player': return [a, 'Il nome che fa sognare'];
      case 'replace':return [a, 'Chi parte per fargli posto?'];
      default: return ['',''];
    }
  };

  function onResult(i, seg){
    setPicked(seg); setSpun(true);
    if(stage==='budget')  setBudget(seg.label);
    if(stage==='count')   setCount(parseInt(seg.label,10) || 1);
    if(stage==='role')    setCur(c=>({...c, roleKey:seg.key, roleLabel:seg.label}));
    if(stage==='league')  setCur(c=>({...c, league:seg.label}));
    if(stage==='player')  setCur(c=>({...c, player:{n:seg.label, ovr:seg.ovr}}));
    if(stage==='replace') setCur(c=>({...c, out:{n:seg.label, ovr:seg.ovr}}));
  }

  function reset(){ setPicked(null); setSpun(false); }

  function advance(){
    if(stage==='ask'){
      if(picked && picked.label==='No'){ onDone([]); return; }
      setStage('budget'); reset(); return;
    }
    if(stage==='budget'){ setStage('count'); reset(); return; }
    if(stage==='count'){ setAcqIdx(0); setCur({}); setStage('league'); reset(); return; }
    if(stage==='league'){ setStage('role'); reset(); return; }
    if(stage==='role'){ setStage('player'); reset(); return; }
    if(stage==='player'){ setStage('replace'); reset(); return; }
    if(stage==='replace'){ setStage('confirm'); reset(); return; }
  }

  function confirmBuy(){
    const entry = { in:cur.player, out:cur.out, role:cur.roleLabel, league:cur.league };
    const nl = [...doneList, entry];
    setDone(nl);
    if(acqIdx+1 < count){ setAcqIdx(acqIdx+1); setCur({}); setStage('league'); reset(); }
    else { setStage('summary'); }
  }
  function rejectBuy(){ setCur(c=>({ roleKey:c.roleKey, roleLabel:c.roleLabel, league:c.league })); setStage('player'); reset(); }

  const [kick, title] = promptFor();
  const heading = mode==='estate' ? 'Deadline Day · Estate' : 'Deadline Day · Gennaio';
  const delta = (cur.player?.ovr||0)-(cur.out?.ovr||0);

  /* ---- CONFIRM → BREAKING NEWS ---- */
  if(stage==='confirm'){
    return (
      <div className="stack fade-key mkt" style={{flex:1,minHeight:0}}>
        <DeadlineBar heading={heading}/>
        <div className="screen-scroll mkt-scroll">
          <div className="brk">
            <div className="brk-flash"><span className="brk-bolt">⚡</span>Breaking news</div>
            <div className="brk-body">
              <span className="brk-stamp">Ufficiale</span>
              <div className="brk-deal">
                <b className="brk-in">{cur.player?.n}</b>
                <span className="brk-to">è un nuovo giocatore di</span>
                <b className="brk-club">{teamName}</b>
              </div>
              <div className="brk-meta">
                <span>{cur.roleLabel}</span><i></i><span>da {cur.league}</span><i></i><span>OVR {cur.player?.ovr}</span>
              </div>
            </div>
            <div className="brk-swap">
              <div className="brk-col out">
                <span>Saluta</span>
                <b>{cur.out?.n}</b>
                <small>OVR {cur.out?.ovr}</small>
              </div>
              <div className="brk-vs">⇄</div>
              <div className="brk-col in">
                <span>Arriva</span>
                <b>{cur.player?.n}</b>
                <small>OVR {cur.player?.ovr}</small>
              </div>
            </div>
            <div className={`brk-delta ${delta>=0?'pos':'neg'}`}>
              <span>Impatto sulla rosa</span>
              <b>{delta>=0?'+':''}{delta} OVR</b>
            </div>
          </div>
        </div>
        <div className="screen-foot mkt-foot">
          <div className="btn-row">
            <button className="btn dark" style={{flex:'0 0 40%'}} onClick={rejectBuy}>Salta il colpo</button>
            <button className="btn primary" style={{flex:1}} onClick={confirmBuy}>Firma il contratto ▸</button>
          </div>
        </div>
        <NewsTicker/>
      </div>
    );
  }

  /* ---- SUMMARY → MERCATO CHIUSO ---- */
  if(stage==='summary'){
    return (
      <div className="stack fade-key mkt" style={{flex:1,minHeight:0}}>
        <DeadlineBar heading={heading}/>
        <div className="screen-scroll mkt-scroll">
          <div className="mkt-close">
            <span className="mkt-close-gong">● Gong</span>
            <h2 className="mkt-close-title">Mercato chiuso</h2>
            <p className="mkt-close-sub">{doneList.length} operazion{doneList.length===1?'e':'i'} · budget {budget||'—'}</p>
          </div>
          <div className="mkt-deals">
            {doneList.map((e,i)=>(
              <div key={i} className="mkt-deal-row">
                <span className="mkt-deal-role">{e.role}</span>
                <span className="mkt-deal-in">＋ {e.in?.n}</span>
                <span className="mkt-deal-out">－ {e.out?.n}</span>
              </div>
            ))}
            {doneList.length===0 && <p className="muted" style={{padding:'12px 4px',fontSize:13}}>Sessione chiusa senza operazioni.</p>}
          </div>
        </div>
        <div className="screen-foot mkt-foot">
          <button className="btn primary" onClick={()=>onDone(doneList)}>Torna alla stagione ▸</button>
        </div>
        <NewsTicker/>
      </div>
    );
  }

  /* ---- WHEEL stages → ON-AIR draw ---- */
  return (
    <div className="stack fade-key mkt" style={{flex:1,minHeight:0}}>
      <DeadlineBar heading={heading}/>
      <div className="screen-scroll mkt-scroll">
        <div className="mkt-lower3">
          <span className="mkt-l3-kick">{kick}</span>
          <h2 className="mkt-l3-title">{title}</h2>
        </div>
        <div className="mkt-stage">
          <span className="mkt-onair"><i></i>On air · estrazione</span>
          <div className="mkt-wheelframe">
            <span className="bk tl"></span><span className="bk tr"></span>
            <span className="bk bl"></span><span className="bk br"></span>
            <div className="wheelwrap">
              <Wheel key={stage+'-'+acqIdx} segments={segsFor()} onResult={onResult} glow="#FFC23C"/>
            </div>
          </div>
          {spun && picked && (
            <div className="mkt-pick"><b>{picked.label}</b><span>{picked.sub||'in agenda'}</span></div>
          )}
        </div>
      </div>
      <div className="screen-foot mkt-foot">
        <button className="btn primary" style={{opacity:spun?1:.4, pointerEvents:spun?'auto':'none'}} onClick={advance}>
          {stage==='ask' && picked && picked.label==='No' ? 'Chiudi senza colpi ▸' : 'Manda in onda ▸'}
        </button>
      </div>
      <NewsTicker/>
    </div>
  );
}

window.TransferFlow = TransferFlow;
