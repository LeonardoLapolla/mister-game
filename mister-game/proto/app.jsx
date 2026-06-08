/* MISTER · PRO PITCH prototype — main app & screens */
const { useState: uS, useEffect: uE, useRef: uR } = React;
const DATA = window.MISTER_DATA;

function App(){
  const { StatusBar, Wheel, Drawer, ResultOverlay, Icon } = window.MisterUI;
  const [screen, setScreen] = uS('home');     // home|setup|squad|season|transfer|results|endseason
  uE(()=>{ window.__setScreen = setScreen; }, []);
  const [drawer, setDrawer] = uS(false);
  const [overlay, setOverlay] = uS(null);
  const [season, setSeason] = uS(1);          // 1..3
  const [phase, setPhase]   = uS('andata');   // andata | ritorno
  const [matchesPlayed, setMatchesPlayed] = uS(0);
  const [transferMode, setTransferMode] = uS('gennaio');
  const [toast, setToast] = uS(null);
  const [comp, setComp] = uS('europa');       // champions | europa | conference
  const [formation, setFormation] = uS('433'); // 433 | 442 | 352 | 4231

  const FORM_ID = { '4-3-3':'433', '4-4-2':'442', '3-5-2':'352', '4-2-3-1':'4231' };
  // when entering the squad, default the pitch to the module rolled in setup
  uE(()=>{ if(screen==='squad' && picks.formation){ setFormation(FORM_ID[picks.formation] || '433'); } }, [screen]);
  const lineup = DATA.formationLineups[formation] || DATA.lineup;
  const formMeta = (DATA.formationList.find(f=>f.id===formation)) || DATA.formationList[0];

  const COMPS = {
    champions:  { name:'Champions League', short:'UCL', opp:'Bayern M.',  oppc:'BM' },
    europa:     { name:'Europa League',     short:'UEL', opp:'Bruges V.',  oppc:'BV' },
    conference: { name:'Conference League', short:'UECL',opp:'AZ Alkmaar', oppc:'AZ' }
  };

  // ---- setup state machine ----
  const setupSteps = [
    { key:'league',    prompt:'Campionato', segs: DATA.leagues },
    { key:'budget',    prompt:'Budget',     segs: DATA.budgets },
    { key:'formation', prompt:'Modulo',     segs: DATA.formations },
    { key:'name',      prompt:'Nome squadra', segs: DATA.teamNames },
    { key:'gk',  prompt:'Portiere',     segs: DATA.players.GK.map(p=>({label:p.n,sub:'OVR '+p.ovr,color:p.c})) },
    { key:'def', prompt:'Difensore',    segs: DATA.players.DEF.map(p=>({label:p.n,sub:'OVR '+p.ovr,color:p.c})) },
    { key:'mid', prompt:'Centrocampo',  segs: DATA.players.MID.map(p=>({label:p.n,sub:'OVR '+p.ovr,color:p.c})) },
    { key:'att', prompt:'Attaccante',   segs: DATA.players.ATT.map(p=>({label:p.n,sub:'OVR '+p.ovr,color:p.c})) }
  ];
  const [stepIdx, setStepIdx] = uS(0);
  const [picks, setPicks] = uS({});
  const [spunThisStep, setSpunThisStep] = uS(false);

  const step = setupSteps[stepIdx];

  function onWheelResult(i, seg){
    setPicks(p=>({...p, [step.key]: seg.label}));
    setSpunThisStep(true);
  }
  function nextStep(){
    if(stepIdx < setupSteps.length-1){ setStepIdx(stepIdx+1); setSpunThisStep(false); }
    else { setScreen('squad'); }
  }

  function startSetup(){
    setScreen('setup'); setStepIdx(0); setPicks({}); setSpunThisStep(false);
  }

  // ---- season match ----
  const [fixtureIdx, setFixtureIdx] = uS(0);
  const fx = DATA.fixtures[fixtureIdx % DATA.fixtures.length];

  // randomly roll a bonus/malus (or none) for the current match
  function rollEvent(){
    if(Math.random() < 0.18) return null;
    const pool = Math.random() < 0.5 ? DATA.events.bonus : DATA.events.malus;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  const [matchEvent, setMatchEvent] = uS(()=>rollEvent());
  uE(()=>{ setMatchEvent(rollEvent()); }, [fixtureIdx, season, phase]);
  function playMatch(){
    // weight result by probability
    const r = Math.random()*100;
    let kind, score;
    if(r < fx.pv){ kind='win'; score = pick(['3 — 1','2 — 0','1 — 0','2 — 1']); }
    else if(r < fx.pv+fx.pp){ kind='draw'; score = pick(['1 — 1','0 — 0','2 — 2']); }
    else { kind='loss'; score = pick(['0 — 1','1 — 2','0 — 2']); }
    setOverlay({ kind, score, opp: fx.opp, home: picks.name || 'FC Furia' });
  }
  function closeOverlay(){
    setOverlay(null);
    setFixtureIdx(i=>i+1);
    setMatchesPlayed(m=>m+1);
  }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

  // ---- phase orchestration ----
  function gotoTransfer(mode){ setTransferMode(mode); setScreen('transfer'); }
  function onTransferDone(){
    if(transferMode==='gennaio'){ setPhase('ritorno'); setMatchesPlayed(0); setFixtureIdx(0); setScreen('season'); }
    else { startNewSeason(); }
  }
  function startNewSeason(){
    if(season >= 3){ setScreen('final'); return; }
    setSeason(s=>s+1); setPhase('andata'); setMatchesPlayed(0); setFixtureIdx(0); setScreen('interseason');
  }
  function restartGame(){
    setSeason(1); setPhase('andata'); setMatchesPlayed(0); setFixtureIdx(0);
    setStepIdx(0); setPicks({}); setSpunThisStep(false); setScreen('home');
  }
  function showEuropa(c){
    const map = { ch:'champions', el:'europa', co:'conference' };
    setComp(map[c] || 'europa'); setScreen('europa');
  }

  const seasonScore = 1480;
  // contextual "next phase" shortcut shown in the season hub
  const phaseCTA = phase==='andata'
    ? { label:'▸ Mercato di gennaio', go:()=>gotoTransfer('gennaio') }
    : { label:'▸ Risultati finali',   go:()=>setScreen('results') };

  const teamName = picks.name || 'FC Furia';

  return (
    <div className="device">
      <div className={`screen ${screen==='europa' ? 'theme-'+comp : ''}`}>

        {/* ============ HOME ============ */}
        {screen==='home' && (
          <div className="home fade-key">
            <div className="home-bg" aria-hidden="true"></div>
            <div className="home-top">
              <span className="badge anim-up" style={{'--d':'.05s'}}>● Stagione 1 di 3</span>
            </div>
            <div className="home-hero">
              <div className="logo anim-up" style={{'--d':'.12s'}}>
                <span className="logo-glow"></span>
                <span className="logo-wheel"></span>
                <span className="logo-hub">M</span>
              </div>
              <h1 className="wordmark anim-up" style={{'--d':'.34s'}}>MISTER</h1>
              <p className="tagline anim-up" style={{'--d':'.46s'}}>A colpi di ruota</p>
            </div>
            <div className="home-foot">
              <p className="sub anim-up" style={{'--d':'.56s'}}>Gira le ruote, costruisci la rosa e vivi la stagione — poi passa il telefono agli amici.</p>
              <button className="btn primary cta-shine anim-up" style={{'--d':'.68s'}} onClick={startSetup}>Inizia ▸</button>
              <div className="meta anim-up" style={{'--d':'.8s'}}><span>Ruota</span><span>·</span><span>Squadra</span><span>·</span><span>Europa</span></div>
            </div>
          </div>
        )}

        {/* ============ SETUP / WHEEL ============ */}
        {screen==='setup' && (
          <div className="stack fade-key" style={{flex:1,minHeight:0}}>
            <div className="steps">
              {setupSteps.map((s,i)=>(
                <i key={i} className={i<stepIdx?'done':i===stepIdx?'now':''}></i>
              ))}
            </div>
            <div className="setup-prompt">
              <div className="lbl">Step {stepIdx+1} di {setupSteps.length}</div>
              <h2>{step.prompt}</h2>
            </div>
            <div className="screen-scroll">
              <div className="wheelwrap">
                <Wheel key={step.key} segments={step.segs} onResult={onWheelResult} glow="#16C784"/>
              </div>
              {spunThisStep && (
                <div className="result-tag">
                  <b>{picks[step.key]}</b>
                  <span>selezionato</span>
                </div>
              )}
            </div>
            <div className="screen-foot">
              <div className="btn-row">
                {stepIdx>0 && <button className="btn dark" style={{flex:'0 0 38%'}} onClick={()=>{setStepIdx(stepIdx-1);setSpunThisStep(true);}}>Indietro</button>}
                <button className="btn primary" style={{flex:1, opacity:spunThisStep?1:.4, pointerEvents:spunThisStep?'auto':'none'}} onClick={nextStep}>
                  {stepIdx<setupSteps.length-1?'Avanti ▸':'Vai alla rosa ▸'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ SQUAD ============ */}
        {screen==='squad' && (
          <div className="stack fade-key" style={{flex:1,minHeight:0}}>
            <div className="gtop">
              <div className="team">
                <div className="crest">{(teamName.split(' ').pop()||'F')[0]}</div>
                <div><small>La tua squadra</small><b>{teamName}</b></div>
              </div>
              <div className="pill"><b>{formMeta.label}</b><span>{formMeta.sub}</span></div>
            </div>
            <div className="screen-scroll">
              <div className="form-switch">
                {DATA.formationList.map(f=>(
                  <button key={f.id} className={`fs-btn ${formation===f.id?'on':''}`} onClick={()=>setFormation(f.id)}>
                    <b>{f.label}</b><span>{f.sub}</span>
                  </button>
                ))}
              </div>
              <div className="pitch">
                <svg className="lines" viewBox="0 0 100 133" preserveAspectRatio="none">
                  <g fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="0.5">
                    <rect x="3" y="3" width="94" height="127"/>
                    <line x1="3" y1="66.5" x2="97" y2="66.5"/>
                    <circle cx="50" cy="66.5" r="11"/>
                    <rect x="28" y="3" width="44" height="20"/>
                    <rect x="28" y="110" width="44" height="20"/>
                  </g>
                </svg>
                {lineup.map((p,i)=>(
                  <div key={i} className="pos" style={{left:p.x+'%', top:p.y+'%'}}>
                    <div className="jersey">{p.num}</div>
                    <small>{p.n}</small>
                  </div>
                ))}
              </div>
              <div className="section-title">Rosa · titolari</div>
              <div className="roster">
                {lineup.map((p,i)=>(
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
            <div className="screen-foot">
              <button className="btn primary" onClick={()=>setScreen('season')}>Inizia stagione ▸</button>
            </div>
          </div>
        )}

        {/* ============ SEASON HUB ============ */}
        {screen==='season' && (
          <div className="stack fade-key" style={{flex:1,minHeight:0}}>
            <div className="gtop">
              <div className="team">
                <div className="crest">{(teamName.split(' ').pop()||'F')[0]}</div>
                <div><small>Stagione {season} · {phase==='andata'?'Andata':'Ritorno'}</small><b>{teamName}</b></div>
              </div>
              <button className="pill" style={{cursor:'pointer'}} onClick={()=>setDrawer(true)}>
                <b>5°</b><span>Classifica ▸</span>
              </button>
            </div>
            <div className="screen-scroll">
              <div className="stats-bar">
                <div className="c hl"><div className="n">47</div><div className="k">Punti</div></div>
                <div className="c v"><div className="n">14</div><div className="k">V</div></div>
                <div className="c p"><div className="n">5</div><div className="k">P</div></div>
                <div className="c s"><div className="n">4</div><div className="k">S</div></div>
                <div className="c"><div className="n">41</div><div className="k">Gol</div></div>
              </div>

              {fixtureIdx < 1 && (
                <div></div>
              )}

              <div className="match-card">
                <div className="mh">
                  <div className="opp">
                    <div className="crest">{fx.crest}</div>
                    <div><b>{fx.opp}</b><small>{fx.sub}</small></div>
                  </div>
                  <span className="ha">{fx.ha}</span>
                </div>
                <div className="forza">
                  <span className="lbl">Forza</span>
                  <div className="bars">
                    {[0,1,2,3,4].map(n=><i key={n} className={n<fx.forza?'f':''}></i>)}
                  </div>
                </div>
                <div className="prob">
                  <span className="pv" style={{flex:fx.pv}}>{fx.pv}%</span>
                  <span className="pp" style={{flex:fx.pp}}>{fx.pp}%</span>
                  <span className="ps" style={{flex:fx.ps}}>{fx.ps}%</span>
                </div>
                <div className="prob-key">
                  <span><i style={{background:'var(--win)'}}></i>Vittoria</span>
                  <span><i style={{background:'var(--draw)'}}></i>Pareggio</span>
                  <span><i style={{background:'var(--loss)'}}></i>Sconfitta</span>
                </div>

              {matchEvent ? (
                  <div className={`mc-event ${matchEvent.type}`}>
                    <div className="ic"><Icon name={matchEvent.icon} size={20}/></div>
                    <div className="tx">
                      <b>{matchEvent.t}<span className="tag">{matchEvent.type==='bonus'?'Bonus':'Malus'}</span></b>
                      <span>{matchEvent.d}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mc-event none">
                    <div className="ic">=</div>
                    <div className="tx"><b>Nessun evento</b><span>Partita regolare, nessun bonus o malus.</span></div>
                  </div>
                )}
              </div>
              <div style={{height:14}}></div>
            </div>
            <div className="screen-foot">
              <div className="btn-row">
                <button className="btn primary" style={{flex:1}} onClick={playMatch}>Gioca partita</button>
                <button className="btn ghost" style={{flex:'0 0 40%'}} onClick={playMatch}>Simula ▸</button>
              </div>
              <button className="phase-link" onClick={phaseCTA.go}>
                {phaseCTA.label}
                <span className="phase-hint">{phase==='andata'?'a metà stagione':'fine campionato'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============ TRANSFER ============ */}
        {screen==='transfer' && (
          <window.TransferFlow mode={transferMode} teamName={teamName} onDone={onTransferDone}/>
        )}

        {/* ============ RESULTS ============ */}
        {screen==='results' && (
          <window.ResultsScreen teamName={teamName} season={season} onNext={()=>setScreen('endseason')}/>
        )}

        {/* ============ END SEASON ============ */}
        {screen==='endseason' && (
          <window.EndSeasonScreen teamName={teamName} season={season}
            onSummerMarket={()=>gotoTransfer('estate')} onNewSeason={startNewSeason} onEuropa={showEuropa}/>
        )}

        {/* ============ INTER-SEASON ============ */}
        {screen==='interseason' && (
          <window.InterSeasonScreen teamName={teamName} season={season} onStart={()=>setScreen('season')}/>
        )}

        {/* ============ FINAL RECAP ============ */}
        {screen==='final' && (
          <window.FinalRecapScreen teamName={teamName} onRestart={restartGame}/>
        )}

        {/* ============ EUROPA — anteprima stile (tema colore competizione) ============ */}
        {screen==='europa' && (
          <div className="stack fade-key" style={{flex:1,minHeight:0}}>
            <div className="gtop">
              <div className="team">
                <div className="crest">{(teamName.split(' ').pop()||'F')[0]}</div>
                <div><small>{COMPS[comp].name} · Girone</small><b>{teamName}</b></div>
              </div>
              <span className="comp-pill">{COMPS[comp].short}</span>
            </div>

            <div className="comp-switch">
              {['champions','europa','conference'].map(k=>(
                <button key={k} className={`cs-btn ${comp===k?'on':''}`} onClick={()=>setComp(k)}>
                  {COMPS[k].short}
                </button>
              ))}
            </div>

            <div className="screen-scroll">
              <div className="comp-hero">
                <span className="euro-badge">{COMPS[comp].name}</span>
                <h2 className="h-display" style={{fontSize:34,marginTop:6}}>Notti europee</h2>
                <p style={{margin:'8px 0 0',color:'var(--ink-dim)',fontSize:13,lineHeight:1.5}}>
                  In coppa l'interfaccia si tinge del colore della competizione. Tocca le sigle qui sopra per cambiare coppa.
                </p>
              </div>

              <div className="stats-bar">
                <div className="c hl"><div className="n">9</div><div className="k">Punti</div></div>
                <div className="c v"><div className="n">3</div><div className="k">V</div></div>
                <div className="c p"><div className="n">0</div><div className="k">P</div></div>
                <div className="c s"><div className="n">1</div><div className="k">S</div></div>
                <div className="c"><div className="n">7</div><div className="k">Gol</div></div>
              </div>

              <div className="match-card">
                <div className="mh">
                  <div className="opp">
                    <div className="crest">{COMPS[comp].oppc}</div>
                    <div><b>{COMPS[comp].opp}</b><small>Girone · 4ª</small></div>
                  </div>
                  <span className="ha">Casa</span>
                </div>
                <div className="prob">
                  <span className="pv" style={{flex:55}}>55%</span>
                  <span className="pp" style={{flex:25}}>25%</span>
                  <span className="ps" style={{flex:20}}>20%</span>
                </div>
                <div className="prob-key">
                  <span><i style={{background:'var(--win)'}}></i>Vittoria</span>
                  <span><i style={{background:'var(--draw)'}}></i>Pareggio</span>
                  <span><i style={{background:'var(--loss)'}}></i>Sconfitta</span>
                </div>
              </div>

              <div className="note-card">
                Anteprima di stile — la fase a gironi (36 squadre) e il tabellone a eliminazione li costruiamo insieme quando mi spieghi come li immagini.
              </div>
              <div style={{height:14}}></div>
            </div>
            <div className="screen-foot">
              <button className="btn primary" onClick={()=>setScreen('endseason')}>Torna al riepilogo ▸</button>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
        <Drawer open={drawer} onClose={()=>setDrawer(false)}/>
        <ResultOverlay data={overlay} onClose={closeOverlay}/>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
