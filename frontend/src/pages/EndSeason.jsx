import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import useBlockBack from '../hooks/useBlockBack'
import usePageGuard from '../hooks/usePageGuard'

const LEAGUES = [
  { code: 'PL', name: 'Premier League', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#6D28D9' },
  { code: 'SA', name: 'Serie A', country: '🇮🇹', color: '#1D4ED8' },
  { code: 'BL', name: 'Bundesliga', country: '🇩🇪', color: '#DC2626' },
  { code: 'LL', name: 'La Liga', country: '🇪🇸', color: '#EA580C' },
  { code: 'L1', name: 'Ligue 1', country: '🇫🇷', color: '#0EA5E9' },
]

const BUDGET_OPTIONS_BY_POSITION = {
  top: [{ value: 80, label: '80M', maxRating: 86 }, { value: 100, label: '100M', maxRating: 99 }],
  mid: [{ value: 50, label: '50M', maxRating: 84 }, { value: 80, label: '80M', maxRating: 86 }],
  low: [{ value: 30, label: '30M', maxRating: 78 }, { value: 50, label: '50M', maxRating: 84 }],
}

function getBudgetTier(position) {
  if (position <= 5) return 'top'
  if (position <= 10) return 'mid'
  return 'low'
}

const MAX_SEASONS = 3
const SEG_COLORS = ['#16C784','#F97316','#8B5CF6','#EF4444','#0EA5E9','#F59E0B','#6D28D9','#DC2626','#1D4ED8','#EA580C']

const FORMATION_LAYOUT = {
  '4-3-3': [{ pos:'ATT',count:3},{ pos:'MID',count:3},{ pos:'DEF',count:4},{ pos:'GK',count:1}],
  '4-4-2': [{ pos:'ATT',count:2},{ pos:'MID',count:4},{ pos:'DEF',count:4},{ pos:'GK',count:1}],
  '3-5-2': [{ pos:'ATT',count:2},{ pos:'MID',count:5},{ pos:'DEF',count:3},{ pos:'GK',count:1}],
  '5-3-2': [{ pos:'ATT',count:2},{ pos:'MID',count:3},{ pos:'DEF',count:5},{ pos:'GK',count:1}],
  '4-2-3-1': [{ pos:'ATT',count:1},{ pos:'MID',count:5},{ pos:'DEF',count:4},{ pos:'GK',count:1}],
}

function pitchPositions(layout, playersByPosition) {
  const positions = []
  const rows = layout.length
  layout.forEach((row, rowIdx) => {
    const yPct = 12 + (rowIdx / (rows - 1)) * 76
    for (let i = 0; i < row.count; i++) {
      const xPct = row.count === 1 ? 50 : 12 + (i / (row.count - 1)) * 76
      positions.push({ xPct, yPct, player: playersByPosition[row.pos]?.[i], pos: row.pos })
    }
  })
  return positions
}
const ROLE_LABELS = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', ATT: 'Forward' }

const TICKER_NEWS = [
  'Sources claim advanced talks between a top club and a Serie A striker',
  'Real Madrid monitoring a young Napoli talent: bid incoming?',
  'Deal close between Milan and a Bundesliga forward · agent in Milan',
  'Inter weighing a free agent to bolster defence this summer',
  'Roma in talks with PSG over a midfielder swap',
  'Napoli incoming: Premier League interest in their number 10',
  'Juventus: contact with Chelsea over a wide player of international calibre',
  'Talks stalled between Lazio and a French club · awaiting response',
]

function DeadlineBar({ heading }) {
  const [clock, setClock] = useState(3 * 3600 - 17)
  useEffect(() => {
    const t = setInterval(() => setClock(c => c > 0 ? c - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])
  const hh = String(Math.floor(clock / 3600)).padStart(2, '0')
  const mm = String(Math.floor((clock % 3600) / 60)).padStart(2, '0')
  const ss = String(clock % 60).padStart(2, '0')
  const urgent = clock < 1800
  return (
    <div className={`mkt-bar${urgent ? ' urgent' : ''}`}>
      <span className="mkt-live"><i></i>LIVE</span>
      <span className="mkt-bar-title">{heading}</span>
      <span className="mkt-clock">
        <span className="mkt-clock-k">Deadline</span>
        <b>{hh}:{mm}:{ss}</b>
      </span>
    </div>
  )
}

function NewsTicker() {
  return (
    <div className="mkt-ticker">
      <span className="mkt-ticker-tag"><i></i>Breaking</span>
      <div className="mkt-ticker-view">
        <div className="mkt-ticker-run">
          {TICKER_NEWS.map((t, i) => <span key={i}>{t}</span>)}
          {TICKER_NEWS.map((t, i) => <span key={'b' + i}>{t}</span>)}
        </div>
      </div>
    </div>
  )
}

function SpinWheel({ items, onResult, resetKey }) {
  const canvasRef = useRef(null)
  const angleRef = useRef(0)
  const rafRef = useRef(null)
  const [spinning, setSpinning] = useState(false)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    setLocked(false); setSpinning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [resetKey])

  useEffect(() => { drawWheel(angleRef.current) }, [items])

  useEffect(() => {
    const h = (e) => { if (e.code === 'Space') { e.preventDefault(); spin() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [spinning, locked])

  function drawWheel(angle) {
    const canvas = canvasRef.current
    if (!canvas || items.length === 0) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 8
    ctx.clearRect(0, 0, W, H)
    const arc = (2 * Math.PI) / items.length
    items.forEach((item, i) => {
      const start = angle + i * arc
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, start, start + arc); ctx.closePath()
      ctx.fillStyle = item.color || SEG_COLORS[i % SEG_COLORS.length]; ctx.fill()
      ctx.strokeStyle = 'rgba(4,7,10,.6)'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + arc / 2)
      ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.font = "bold 12px 'Saira Condensed', monospace"
      ctx.fillText((item.label || String(item)).slice(0, 14), R - 10, 5)
      ctx.restore()
    })
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 2 * Math.PI)
    const g = ctx.createRadialGradient(cx, cy - 4, 0, cx, cy, 20)
    g.addColorStop(0, '#5BE3B0'); g.addColorStop(1, '#0FA56C')
    ctx.fillStyle = g; ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5; ctx.stroke()
  }

  function getResult(angle) {
    const arc = (2 * Math.PI) / items.length
    const n = (((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))
    return items[Math.floor(n / arc) % items.length]
  }

  function spin() {
    if (spinning || locked || items.length === 0) return
    setLocked(true); setSpinning(true)
    const total = (10 + Math.random() * 10) * 2 * Math.PI
    const dur = 3000 + Math.random() * 1500
    const t0 = performance.now(), a0 = angleRef.current
    function animate(now) {
      const p = Math.min((now - t0) / dur, 1)
      angleRef.current = a0 + total * (1 - Math.pow(1 - p, 4))
      drawWheel(angleRef.current)
      if (p < 1) { rafRef.current = requestAnimationFrame(animate) }
      else { setSpinning(false); onResult(getResult(angleRef.current)) }
    }
    rafRef.current = requestAnimationFrame(animate)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '50%', right: -14, transform: 'translateY(-50%)', zIndex: 10,
          width: 0, height: 0,
          borderTop: '11px solid transparent', borderBottom: '11px solid transparent',
          borderRight: '18px solid #fff',
          filter: 'drop-shadow(0 0 8px rgba(22,199,132,.7))'
        }} />
        <canvas ref={canvasRef} width={280} height={280}
          style={{ borderRadius: '50%', display: 'block', cursor: locked ? 'default' : 'pointer' }}
          onClick={spin}
        />
      </div>
      <button onClick={spin} disabled={spinning || locked || items.length === 0}
        className="btn primary btn-sm"
        style={{ opacity: (spinning || locked || items.length === 0) ? 0.45 : 1, width: 'auto', minWidth: 140 }}>
        {spinning ? 'SPINNING...' : locked ? 'SPUN ✓' : 'SPIN!'}
      </button>
    </div>
  )
}

export default function EndSeason() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()
  useBlockBack()
  const guardPassed = usePageGuard(sessionId, s => !s.finished ? `/squad/${sessionId}` : null)

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [players, setPlayers] = useState([])
  const [allPlayers, setAllPlayers] = useState({})

  const [phase, setPhase] = useState('recap')
  const [resetKey, setResetKey] = useState(0)
  const [result, setResult] = useState(null)
  const [europaCompetition, setEuropaCompetition] = useState(null)

  const [budget, setBudget] = useState(null)
  const [signingCount, setSigningCount] = useState(0)
  const [currentSigning, setCurrentSigning] = useState(0)
  const [signingStep, setSigningStep] = useState('league')
  const [signingLeague, setSigningLeague] = useState(null)
  const [signingRole, setSigningRole] = useState(null)
  const [newPlayer, setNewPlayer] = useState(null)
  const [playerToReplace, setPlayerToReplace] = useState(null)
  const [pendingTransfer, setPendingTransfer] = useState(null)
  const [wheelItems, setWheelItems] = useState([])
  const [pendingStep, setPendingStep] = useState(null)
  const [completedSignings, setCompletedSignings] = useState([])
  const [myPlayers, setMyPlayers] = useState([])
  const [saving, setSaving] = useState(false)
  const [europaCheckLoading, setEuropaCheckLoading] = useState(true)

  const nextSeasonCalledRef = useRef(false)

  const position = parseInt(searchParams.get('position')) || 10
  const fromEuropa = searchParams.get('fromEuropa') === 'true'

  const totalTeams = 21
  const isRelegated = position > totalTeams - 3

  useEffect(() => { fetchData() }, [sessionId])

  useEffect(() => {
    if (pendingStep && wheelItems.length > 0) {
      setSigningStep(pendingStep); setPendingStep(null); setResult(null); setResetKey(k => k + 1)
    }
  }, [wheelItems, pendingStep])

  useEffect(() => {
    if (fromEuropa && !loading && data) {
      if (nextSeasonCalledRef.current) return
      nextSeasonCalledRef.current = true
      // Remove fromEuropa from URL immediately so refresh doesn't re-trigger this
      navigate(`/end-season/${sessionId}?position=${position}`, { replace: true })
      const seasonNumber = data?.seasonNumber || 1
      if (isRelegated || seasonNumber > MAX_SEASONS) handleFinalRecap()
      else handleNextSeason()
    }
  }, [fromEuropa, loading, data])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/game/${sessionId}`)
      const d = await res.json()
      setSession(d.session); setPlayers(d.session.players || [])
      setMyPlayers(d.session.players || []); setData(d.session)
      const hRes = await fetch(`/api/game/${sessionId}/history`)
      const hData = await hRes.json(); setHistory(hData.history || [])
      const pRes = await fetch('/api/market/all-players')
      const pData = await pRes.json(); setAllPlayers(pData.players || {})
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (position && data) {
      if (fromEuropa) { setEuropaCheckLoading(false); return }
      setEuropaCheckLoading(true)
      fetch(`/api/europa/${sessionId}/state`)
        .then(r => {
          if (!r.ok) {
            return fetch(`/api/europa/${sessionId}/check?position=${position}`)
              .then(r2 => r2.json()).then(d => setEuropaCompetition(d.competition))
          }
          return r.json().then(d => {
            if (d.phase === 'eliminated' || d.phase === 'winner') setEuropaCompetition(null)
            else setEuropaCompetition(d.competition)
          })
        })
        .catch(() => setEuropaCompetition(null))
        .finally(() => setEuropaCheckLoading(false))
    }
  }, [position, data])

  const handleNextSeason = async () => {
    let europaScore = 0
    try { const r = await fetch(`/api/europa/${sessionId}/score`); const d = await r.json(); europaScore = d.score || 0 } catch {}
    const seasonScore = data?.finalScore || 0
    const res = await fetch(`/api/game/${sessionId}/next-season`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position, finalScore: seasonScore + europaScore }),
    })
    const d = await res.json()
    if (d.relegated) { setPhase('relegated'); return }
    if (d.maxSeasons) {
      const hRes = await fetch(`/api/game/${sessionId}/history`)
      const hData = await hRes.json(); setHistory(hData.history || [])
      setPhase('done'); return
    }
    setPhase('budget'); setResetKey(k => k + 1)
  }

  const handleFinalRecap = async () => {
    let europaScore = 0
    try { const r = await fetch(`/api/europa/${sessionId}/score`); const d = await r.json(); europaScore = d.score || 0 } catch {}
    const seasonScore = data?.finalScore || 0
    await fetch(`/api/game/${sessionId}/next-season`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position, finalScore: seasonScore + europaScore }),
    })
    const hRes = await fetch(`/api/game/${sessionId}/history`)
    const hData = await hRes.json(); setHistory(hData.history || [])
    setPhase(isRelegated ? 'relegated' : 'done')
  }

  const getBudgetWheelItems = () => {
    const tier = getBudgetTier(position)
    return BUDGET_OPTIONS_BY_POSITION[tier].map(o => ({
      ...o, color: o.value === 100 ? '#16C784' : o.value === 80 ? '#2E6BFF' : o.value === 50 ? '#F5B43C' : '#FB5566'
    }))
  }

  const getCountWheelItems = () => [
    { label: '2', value: 2, color: '#16C784' }, { label: '2', value: 2, color: '#0FA56C' },
    { label: '2', value: 2, color: '#5BE3B0' }, { label: '3', value: 3, color: '#F5B43C' },
    { label: '3', value: 3, color: '#d97706' }, { label: '4', value: 4, color: '#FB5566' },
  ]

  const getSigningWheelItems = () => {
    if (signingStep === 'league') return LEAGUES.map(l => ({ ...l, label: l.name }))
    if (signingStep === 'role') return [
      { label: 'GK', value: 'GK', color: '#F5B43C' }, { label: 'DEF', value: 'DEF', color: '#2E6BFF' },
      { label: 'MID', value: 'MID', color: '#16C784' }, { label: 'ATT', value: 'ATT', color: '#FB5566' },
    ]
    if (signingStep === 'player' || signingStep === 'replace') return wheelItems
    return []
  }

  const handleResult = (item) => {
    setResult(item)
    if (phase === 'budget') { setBudget(item) }
    else if (phase === 'count') { setSigningCount(item.value) }
    else if (phase === 'signing') {
      if (signingStep === 'league') { setSigningLeague(item) }
      else if (signingStep === 'role') {
        setSigningRole(item)
        const leaguePlayers = allPlayers[signingLeague?.code] || []
        const myNames = myPlayers.map(p => p.name)
        const available = leaguePlayers.filter(p => p.position === item.value)
          .filter(p => p.rating <= (budget?.maxRating || 99)).filter(p => !myNames.includes(p.name)).slice(0, 20)
        setWheelItems(available.map(p => ({ ...p, label: p.name }))); setPendingStep('player'); return
      } else if (signingStep === 'player') {
        setNewPlayer(item)
        setWheelItems(myPlayers.filter(p => p.position === item.position).map(p => ({ ...p, label: p.name })))
        setPendingStep('replace'); return
      } else if (signingStep === 'replace') {
        setPlayerToReplace(item); setPendingTransfer({ in: newPlayer, out: item })
      }
    }
  }

  const skipToNextSigning = () => {
    setPendingTransfer(null)
    const next = currentSigning + 1
    if (next >= signingCount) { setPhase('summary') }
    else {
      setCurrentSigning(next); setSigningStep('league'); setSigningLeague(null); setSigningRole(null)
      setNewPlayer(null); setPlayerToReplace(null); setWheelItems([]); setResult(null); setResetKey(k => k + 1)
    }
  }

  const goNext = async () => {
    if (phase === 'budget') { setPhase('count'); setResult(null); setResetKey(k => k + 1) }
    else if (phase === 'count') { setPhase('signing'); setSigningStep('league'); setResult(null); setResetKey(k => k + 1) }
    else if (phase === 'signing' && signingStep === 'league') { setSigningStep('role'); setResult(null); setResetKey(k => k + 1) }
  }

  const executeTransfer = async () => {
    setSaving(true)
    try {
      await fetch(`/api/market/${sessionId}/sell`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerName: pendingTransfer.out.name }) })
      await fetch(`/api/market/${sessionId}/buy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerName: pendingTransfer.in.name }) })
      setCompletedSignings(prev => [...prev, { in: pendingTransfer.in, out: pendingTransfer.out }])
      setMyPlayers(prev => prev.filter(p => p.name !== pendingTransfer.out.name).concat({ ...pendingTransfer.in }))
      setPendingTransfer(null); skipToNextSigning()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const getStepTitle = () => {
    if (phase === 'budget') return 'Summer budget'
    if (phase === 'count') return 'How many signings?'
    if (phase === 'signing') {
      return { league: `Signing ${currentSigning + 1}/${signingCount} — League`, role: `Signing ${currentSigning + 1}/${signingCount} — Role`, player: `Signing ${currentSigning + 1}/${signingCount} — Player`, replace: `Signing ${currentSigning + 1}/${signingCount} — Who makes way?` }[signingStep]
    }
    return ''
  }

  const getResultLabel = () => {
    if (!result) return null
    if (phase === 'budget') return `${result.label} available`
    if (phase === 'count') return `${result.value} signing${result.value === 1 ? '' : 's'}`
    if (phase === 'signing') {
      if (signingStep === 'league') return result.name
      if (signingStep === 'role') return ROLE_LABELS[result.value] || result.label
      if (signingStep === 'player') return `${result.name} · OVR ${result.rating}`
      if (signingStep === 'replace') return `Out: ${result.name}`
    }
    return null
  }

  if (!guardPassed || loading || (fromEuropa && phase === 'recap')) {
    return <div className="mister-loading"><div>Loading...</div></div>
  }

  const seasonNumber = data?.seasonNumber || 1

  /* ---- FINAL RECAP (done / relegated) ---- */
  if (phase === 'relegated' || phase === 'done') {
    const totalScore = history.reduce((sum, h) => sum + (h.finalScore || 0), 0)
    return (
      <div className="mister-page final">
        <div className="final-bg" />
        <div className="page-scroll" style={{ flex: 1 }}>
          <div className="final-hero">
            <div className="final-cup">{phase === 'relegated' ? '💀' : '🏆'}</div>
            <span className="final-k">{phase === 'relegated' ? 'Game Over' : `${MAX_SEASONS} Seasons completed`}</span>
            <span className="final-total">{totalScore}</span>
            <span className="final-team">{session?.nickname} · total score</span>
          </div>

          <div className="final-stats">
            <div className="fs"><b>{history.length}</b><span>Seasons</span></div>
            <div className="fs">
              <b>{history.reduce((s, h) => s + (h.wins || 0), 0)}</b><span>Wins</span>
            </div>
            <div className="fs">
              <b style={{ color: phase === 'relegated' ? 'var(--loss)' : 'var(--primary)' }}>
                {phase === 'relegated' ? '💀' : history.length >= MAX_SEASONS ? '🏁' : `${history.length}/${MAX_SEASONS}`}
              </b>
              <span>{phase === 'relegated' ? 'Relegated' : 'Final'}</span>
            </div>
          </div>

          <div className="section-title">Season summary</div>
          <div style={{ padding: '0 22px' }}>
            {history.map((h) => (
              <div key={h.seasonNumber} className="hist-row">
                <span className="hist-s">Season {h.seasonNumber}</span>
                <span className="hist-comp" style={{ background: h.position <= 4 ? 'var(--champions)' : h.position <= 6 ? 'var(--europa)' : 'var(--muted)' }} />
                <span className="hist-pos">{h.position}°</span>
                <span className="hist-pt">{h.wins}W {h.draws}D {h.losses}L</span>
                <span className="hist-score">{h.finalScore || 0} pt</span>
              </div>
            ))}
          </div>

          <div className="section-title">Final squad</div>
          {(() => {
            const formation = session?.formation || '4-3-3'
            const layout = FORMATION_LAYOUT[formation] || FORMATION_LAYOUT['4-3-3']
            const byPos = {}
            for (const pos of ['GK','DEF','MID','ATT']) byPos[pos] = players.filter(p => p.position === pos)
            const pitchPos = pitchPositions(layout, byPos)
            return (
              <div className="pitch" style={{ marginBottom: 12 }}>
                <svg className="plines" viewBox="0 0 100 133" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
                  <g fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="0.5">
                    <rect x="3" y="3" width="94" height="127" />
                    <line x1="3" y1="66.5" x2="97" y2="66.5" />
                    <circle cx="50" cy="66.5" r="11" />
                    <rect x="28" y="3" width="44" height="20" />
                    <rect x="28" y="110" width="44" height="20" />
                  </g>
                </svg>
                {pitchPos.map(({ xPct, yPct, player, pos }, i) => (
                  <div key={i} className="ppos" style={{ left: `${xPct}%`, top: `${yPct}%` }}>
                    <div className="pjersey">{player?.rating ?? '?'}</div>
                    <small>{player?.name?.split(' ').pop() ?? pos}</small>
                  </div>
                ))}
              </div>
            )
          })()}
          <div style={{ height: 100 }} />
        </div>
        <div className="screen-foot">
          <button onClick={() => navigate('/')} className="btn primary">PLAY AGAIN ▶</button>
        </div>
      </div>
    )
  }

  /* ---- RECAP PHASE ---- */
  if (phase === 'recap') {
    const teamName = session?.nickname || 'La Tua Squadra'
    return (
      <div className="mister-page inter">
        <div className="inter-bg" />
        <div className="page-scroll" style={{ flex: 1 }}>
          <div className="inter-hero">
            <span className="inter-kick">End of season {seasonNumber}</span>
            <div className="inter-title">{seasonNumber < MAX_SEASONS ? 'Season' : 'Last'}</div>
            <div className="inter-team">{seasonNumber} of {MAX_SEASONS}</div>
          </div>

          {history.length > 0 && (
            <div style={{ padding: '0 22px', marginTop: 16 }}>
              <div className="section-title" style={{ paddingLeft: 0 }}>Previous seasons</div>
              {history.map((h) => (
                <div key={h.seasonNumber} className="hist-row">
                  <span className="hist-s">Season {h.seasonNumber}</span>
                  <span className="hist-comp" style={{ background: h.position <= 4 ? 'var(--champions)' : h.position <= 6 ? 'var(--europa)' : 'var(--muted)' }} />
                  <span className="hist-pos">{h.position}°</span>
                  <span className="hist-pt">{h.wins}W {h.draws}D</span>
                  <span className="hist-score">{h.finalScore || 0} pt</span>
                </div>
              ))}
            </div>
          )}

          {isRelegated && (
            <div style={{ margin: '16px 22px 0', background: 'color-mix(in oklab,var(--loss) 14%,var(--surface))', border: '1px solid color-mix(in oklab,var(--loss) 40%,transparent)', borderRadius: 'var(--r-lg)', padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>💀</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, textTransform: 'uppercase', color: 'var(--loss)' }}>Relegated!</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Your journey ends here.</div>
            </div>
          )}

          {!isRelegated && seasonNumber < MAX_SEASONS && (
            <div className="inter-obj">
              <span className="inter-card-k">Next season objective</span>
              <b>Season {seasonNumber + 1} of {MAX_SEASONS}</b>
            </div>
          )}

          <div style={{ height: 100 }} />
        </div>
        <div className="screen-foot">
          {europaCheckLoading && !isRelegated && seasonNumber < MAX_SEASONS ? (
            <button className="btn ghost" disabled>Checking qualifications...</button>
          ) : europaCompetition && !isRelegated && seasonNumber <= MAX_SEASONS ? (
            <button
              className="euro-ticket"
              style={{ width: 'calc(100% - 0px)', margin: 0 }}
              onClick={() => navigate(`/europa-group/${sessionId}`)}
            >
              <div>
                <span className="euro-badge">
                  {europaCompetition === 'champions' ? 'UEFA Champions League' : europaCompetition === 'europa' ? "UEFA Europa League" : 'UEFA Conference League'}
                </span>
                <b>
                  {europaCompetition === 'champions' ? 'Champions League' : europaCompetition === 'europa' ? "Europa League" : 'Conference League'}
                </b>
                <span className="euro-sub">Qualified — tap to play</span>
              </div>
              <span className="euro-go">▶</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (nextSeasonCalledRef.current) return
                nextSeasonCalledRef.current = true
                if (isRelegated || seasonNumber >= MAX_SEASONS) handleFinalRecap()
                else handleNextSeason()
              }}
              className="btn primary"
            >
              {isRelegated || seasonNumber >= MAX_SEASONS ? 'SEE SUMMARY ▶' : 'START SUMMER MARKET ▶'}
            </button>
          )}
        </div>
      </div>
    )
  }

  const getStepPrompt = () => {
    const a = `Signing ${currentSigning + 1} of ${signingCount}`
    if (phase === 'budget') return ['Summer Transfer Window', 'Available budget']
    if (phase === 'count') return ['Transfer plan', 'How many signings?']
    if (phase === 'signing') {
      if (signingStep === 'league') return [a, 'From which league?']
      if (signingStep === 'role') return [a, 'Which position?']
      if (signingStep === 'player') return [a, 'The signing you dream of']
      if (signingStep === 'replace') return [a, 'Who makes way?']
    }
    return ['Deadline Day', 'Summer window']
  }

  const getResultSub = () => {
    if (!result) return 'pending'
    if (phase === 'signing' && signingStep === 'player') return `OVR ${result.rating}`
    if (phase === 'signing' && signingStep === 'replace') return 'leaving squad'
    return 'selected'
  }

  /* ---- MERCATO ESTIVO SUMMARY ---- */
  if (phase === 'summary') {
    return (
      <div className="mister-page mkt fade-key">
        <DeadlineBar heading="Deadline Day · Estate" />
        <div className="page-scroll mkt-scroll" style={{ flex: 1 }}>
          <div className="mkt-close">
            <span className="mkt-close-gong">● Gong</span>
            <h2 className="mkt-close-title">Window closed</h2>
            <p className="mkt-close-sub">
              {completedSignings.length} deal{completedSignings.length === 1 ? '' : 's'}
              {budget ? ` · budget ${budget.label}` : ''}
            </p>
          </div>
          <div className="mkt-deals">
            {completedSignings.map((s, i) => (
              <div key={i} className="mkt-deal-row">
                <span className="mkt-deal-role">{s.in.position}</span>
                <span className="mkt-deal-in">＋ {s.in.name}</span>
                <span className="mkt-deal-out">－ {s.out.name}</span>
              </div>
            ))}
            {completedSignings.length === 0 && (
              <p style={{ color: 'var(--muted)', padding: '12px 4px', fontSize: 13, fontFamily: 'var(--font-num)' }}>
                Window closed with no deals.
              </p>
            )}
          </div>
        </div>
        <div className="screen-foot mkt-foot">
          <button className="btn primary" onClick={() => navigate(`/squad/${sessionId}`)}>
            Back to squad ▸
          </button>
        </div>
        <NewsTicker />
      </div>
    )
  }

  /* ---- BREAKING NEWS confirm ---- */
  const showNext = result && !pendingStep && !pendingTransfer

  if (pendingTransfer) {
    const delta = (pendingTransfer.in.rating || 0) - (pendingTransfer.out.rating || 0)
    return (
      <div className="mister-page mkt fade-key">
        <DeadlineBar heading="Deadline Day · Estate" />
        <div className="page-scroll mkt-scroll" style={{ flex: 1 }}>
          <div className="brk">
            <div className="brk-flash"><span className="brk-bolt">⚡</span>Breaking news</div>
            <div className="brk-body">
              <span className="brk-stamp">Official</span>
              <div className="brk-deal">
                <b className="brk-in">{pendingTransfer.in.name}</b>
                <span className="brk-to">joins</span>
                <b className="brk-club">{session?.nickname || '—'}</b>
              </div>
              <div className="brk-meta">
                <span>{ROLE_LABELS[signingRole?.value] || signingRole?.label}</span>
                <i></i>
                <span>from {signingLeague?.name}</span>
                <i></i>
                <span>OVR {pendingTransfer.in.rating}</span>
              </div>
            </div>
            <div className="brk-swap">
              <div className="brk-col out">
                <span>Out</span>
                <b>{pendingTransfer.out.name}</b>
                <small>OVR {pendingTransfer.out.rating}</small>
              </div>
              <div className="brk-vs">⇄</div>
              <div className="brk-col in">
                <span>In</span>
                <b>{pendingTransfer.in.name}</b>
                <small>OVR {pendingTransfer.in.rating}</small>
              </div>
            </div>
            <div className={`brk-delta ${delta >= 0 ? 'pos' : 'neg'}`}>
              <span>Squad impact</span>
              <b>{delta >= 0 ? '+' : ''}{delta} OVR</b>
            </div>
          </div>
          {completedSignings.length > 0 && (
            <div className="mkt-deals">
              <div className="section-title" style={{ paddingLeft: 0 }}>Completed</div>
              {completedSignings.map((s, i) => (
                <div key={i} className="mkt-deal-row">
                  <span className="mkt-deal-role">{s.in.position}</span>
                  <span className="mkt-deal-in">＋ {s.in.name}</span>
                  <span className="mkt-deal-out">－ {s.out.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="screen-foot mkt-foot">
          <div className="btn-row">
            <button className="btn dark" style={{ flex: '0 0 40%' }} disabled={saving} onClick={skipToNextSigning}>Skip this deal</button>
            <button className="btn primary" style={{ flex: 1 }} disabled={saving} onClick={executeTransfer}>
              {saving ? '...' : 'Sign the contract ▸'}
            </button>
          </div>
        </div>
        <NewsTicker />
      </div>
    )
  }

  /* ---- WHEEL PHASES (budget / count / signing) ---- */
  const [kick, title] = getStepPrompt()
  return (
    <div className="mister-page mkt fade-key">
      <DeadlineBar heading="Deadline Day · Estate" />
      <div className="page-scroll mkt-scroll" style={{ flex: 1 }}>
        <div className="mkt-lower3">
          <span className="mkt-l3-kick">{kick}</span>
          <h2 className="mkt-l3-title">{title}</h2>
        </div>
        <div className="mkt-stage">
          <span className="mkt-onair"><i></i>Live · draw</span>
          <div className="mkt-wheelframe">
            <span className="bk tl" /><span className="bk tr" />
            <span className="bk bl" /><span className="bk br" />
            <div className="wheelwrap">
              <SpinWheel
                items={
                  phase === 'budget' ? getBudgetWheelItems() :
                  phase === 'count' ? getCountWheelItems() :
                  getSigningWheelItems()
                }
                onResult={handleResult}
                resetKey={resetKey}
              />
            </div>
          </div>
          {result && !pendingStep && (
            <div className="mkt-pick">
              <b>{getResultLabel()}</b>
              <span>{getResultSub()}</span>
            </div>
          )}
        </div>

        {pendingStep && (
          <div style={{ textAlign: 'center', color: 'var(--mkt-amber)', padding: '12px 0', fontFamily: 'var(--font-num)', fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Loading squad...
          </div>
        )}

        {completedSignings.length > 0 && (
          <div className="mkt-deals" style={{ marginTop: 8 }}>
            <div className="section-title" style={{ paddingLeft: 22 }}>Completed</div>
            {completedSignings.map((s, i) => (
              <div key={i} className="mkt-deal-row">
                <span className="mkt-deal-role">{s.in.position}</span>
                <span className="mkt-deal-in">＋ {s.in.name}</span>
                <span className="mkt-deal-out">－ {s.out.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="screen-foot mkt-foot">
        <button
          onClick={showNext && !saving ? goNext : undefined}
          className="btn primary"
          style={{ opacity: showNext && !saving ? 1 : 0.4, pointerEvents: showNext && !saving ? 'auto' : 'none' }}
        >
          Confirm ▸
        </button>
      </div>
      <NewsTicker />
    </div>
  )
}
