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

const BUDGET_OPTIONS = [
  { value: 10, label: '10M', maxRating: 78, color: '#FB5566' },
  { value: 20, label: '20M', maxRating: 82, color: '#F5B43C' },
  { value: 30, label: '30M', maxRating: 86, color: '#16C784' },
  { value: 50, label: '50M', minRating: 78, maxRating: 99, color: '#0EA5E9' },
]

const ROLE_LABELS = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', ATT: 'Forward' }

const TICKER_NEWS = [
  'Sources claim advanced talks between a top club and a Serie A striker',
  'Real Madrid monitoring a young Napoli talent: bid incoming?',
  'Deal close between Milan and a Bundesliga forward · agent in Milan',
  'Inter weighing a free agent to bolster defence in January',
  'Roma in talks with PSG over a midfielder swap',
  'Napoli incoming: Premier League interest in their number 10',
  'Juventus: contact with Chelsea over a wide player of international calibre',
  'Talks stalled between Lazio and a French club · awaiting response',
]

const SEG_COLORS = [
  '#16C784','#F97316','#8B5CF6','#EF4444','#0EA5E9',
  '#F59E0B','#6D28D9','#DC2626','#1D4ED8','#EA580C',
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
    drawWheel(angleRef.current)
  }, [resetKey])

  useEffect(() => { drawWheel(angleRef.current) }, [items])

  useEffect(() => {
    const handleKey = (e) => { if (e.code === 'Space') { e.preventDefault(); spin() } }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [spinning, locked, items])

  function drawWheel(angle) {
    const canvas = canvasRef.current
    if (!canvas || items.length === 0) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const R = Math.min(W, H) / 2 - 8
    ctx.clearRect(0, 0, W, H)
    const arc = (2 * Math.PI) / items.length
    items.forEach((item, i) => {
      const start = angle + i * arc
      ctx.beginPath(); ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, R, start, start + arc)
      ctx.closePath()
      ctx.fillStyle = item.color || SEG_COLORS[i % SEG_COLORS.length]
      ctx.fill(); ctx.strokeStyle = 'rgba(4,7,10,.6)'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + arc / 2)
      ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.font = `bold ${items.length > 10 ? '9' : '11'}px 'Saira Condensed', monospace`
      const label = item.label || item.name || String(item)
      ctx.fillText(label.length > 14 ? label.slice(0, 13) + '…' : label, R - 8, 4)
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
          borderRight: '18px solid #FFC23C',
          filter: 'drop-shadow(0 0 8px rgba(255,194,60,.7))'
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

export default function Transfer() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const isAutoMode = searchParams.get('mode') === 'auto'
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()
  useBlockBack()
  const guardPassed = usePageGuard(sessionId, s => s.finished ? `/results/${sessionId}` : null)

  const [step, setStep] = useState('yesno')
  const [result, setResult] = useState(null)
  const [resetKey, setResetKey] = useState(0)
  const [signingStep, setSigningStep] = useState('league')

  const [doTransfer, setDoTransfer] = useState(null)
  const [budget, setBudget] = useState(null)
  const [signingCount, setSigningCount] = useState(0)
  const [currentSigning, setCurrentSigning] = useState(0)

  const [signingLeague, setSigningLeague] = useState(null)
  const [signingRole, setSigningRole] = useState(null)
  const [newPlayer, setNewPlayer] = useState(null)
  const [playerToReplace, setPlayerToReplace] = useState(null)
  const [pendingTransfer, setPendingTransfer] = useState(null)

  const [myPlayers, setMyPlayers] = useState([])
  const [allPlayers, setAllPlayers] = useState({})
  const [wheelItems, setWheelItems] = useState([])
  const [pendingSigningStep, setPendingSigningStep] = useState(null)
  const [completedSignings, setCompletedSignings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [sessionId])

  useEffect(() => {
    if (pendingSigningStep && wheelItems.length > 0) {
      setSigningStep(pendingSigningStep)
      setPendingSigningStep(null)
      setResult(null)
      setResetKey(k => k + 1)
    }
  }, [wheelItems, pendingSigningStep])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/game/${sessionId}`)
      const data = await res.json()
      setSession(data.session)
      setMyPlayers(data.session.players || [])
      const pRes = await fetch('/api/market/all-players')
      const pData = await pRes.json()
      setAllPlayers(pData.players || {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const skipToNextSigning = () => {
    setPendingTransfer(null)
    const next = currentSigning + 1
    if (next >= signingCount) {
      setStep('summary')
    } else {
      setCurrentSigning(next)
      setSigningStep('league'); setSigningLeague(null); setSigningRole(null)
      setNewPlayer(null); setPlayerToReplace(null); setWheelItems([])
      setResult(null); setResetKey(k => k + 1)
    }
  }

  const getWheelItems = () => {
    if (step === 'yesno') return [
      { label: 'YES!', value: true, color: '#16C784' },
      { label: 'NO', value: false, color: '#FB5566' },
      { label: 'YES!', value: true, color: '#0FA56C' },
      { label: 'NO', value: false, color: '#FB5566' },
    ]
    if (step === 'budget') return BUDGET_OPTIONS.map(b => ({ ...b, label: b.label }))
    if (step === 'count') return [
      { label: '1', value: 1, color: '#16C784' },
      { label: '1', value: 1, color: '#0FA56C' },
      { label: '1', value: 1, color: '#5BE3B0' },
      { label: '2', value: 2, color: '#F5B43C' },
      { label: '2', value: 2, color: '#d97706' },
      { label: '3', value: 3, color: '#FB5566' },
    ]
    if (step === 'signing') {
      if (signingStep === 'league') return LEAGUES.map(l => ({ ...l, label: l.name }))
      if (signingStep === 'role') return [
        { label: 'GK', value: 'GK', color: '#F5B43C' },
        { label: 'DEF', value: 'DEF', color: '#2E6BFF' },
        { label: 'MID', value: 'MID', color: '#16C784' },
        { label: 'ATT', value: 'ATT', color: '#FB5566' },
      ]
      if (signingStep === 'player') return wheelItems
      if (signingStep === 'replace') return wheelItems
    }
    return []
  }

  const handleResult = (item) => {
    setResult(item)
    if (step === 'yesno') { setDoTransfer(item.value) }
    else if (step === 'budget') { setBudget(item) }
    else if (step === 'count') { setSigningCount(item.value) }
    else if (step === 'signing') {
      if (signingStep === 'league') {
        setSigningLeague(item)
      } else if (signingStep === 'role') {
        setSigningRole(item)
        const leaguePlayers = allPlayers[signingLeague?.code] || []
        const myNames = myPlayers.map(p => p.name)
        const available = leaguePlayers
          .filter(p => p.position === item.value)
          .filter(p => p.rating >= (budget?.minRating || 0) && p.rating <= (budget?.maxRating || 99))
          .filter(p => !myNames.includes(p.name))
          .slice(0, 20)
        setWheelItems(available.map(p => ({ ...p, label: p.name })))
        setPendingSigningStep('player'); return
      } else if (signingStep === 'player') {
        setNewPlayer(item)
        const myInRole = myPlayers.filter(p => p.position === item.position)
        setWheelItems(myInRole.map(p => ({ ...p, label: p.name })))
        setPendingSigningStep('replace'); return
      } else if (signingStep === 'replace') {
        setPlayerToReplace(item)
        setPendingTransfer({ in: newPlayer, out: item })
      }
    }
  }

  const goNext = async () => {
    if (step === 'yesno') {
      if (!doTransfer) {
        navigate(`/squad/${sessionId}${isAutoMode ? '?mode=auto' : ''}`)
        return
      }
      setStep('budget'); setResult(null); setResetKey(k => k + 1)
    } else if (step === 'budget') {
      setStep('count'); setResult(null); setResetKey(k => k + 1)
    } else if (step === 'count') {
      setStep('signing'); setSigningStep('league'); setResult(null); setResetKey(k => k + 1)
    } else if (step === 'signing' && signingStep === 'league') {
      setSigningStep('role'); setResult(null); setResetKey(k => k + 1)
    }
  }

  const executeTransfer = async () => {
    setSaving(true)
    try {
      await fetch(`/api/market/${sessionId}/sell`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: pendingTransfer.out.name }),
      })
      await fetch(`/api/market/${sessionId}/buy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: pendingTransfer.in.name }),
      })
      setCompletedSignings(prev => [...prev, { in: pendingTransfer.in, out: pendingTransfer.out }])
      setMyPlayers(prev => prev.filter(p => p.name !== pendingTransfer.out.name).concat({ ...pendingTransfer.in }))
      setPendingTransfer(null)
      skipToNextSigning()
    } catch (err) {
      console.error('Errore transfer:', err)
    } finally {
      setSaving(false)
    }
  }

  const getStepPrompt = () => {
    const a = `Trattativa ${currentSigning + 1} di ${signingCount}`
    if (step === 'yesno') return ['Transfer window opens', 'Open the January window?']
    if (step === 'budget') return ['Transfer budget', 'Available budget']
    if (step === 'count') return ['Transfer plan', 'How many signings?']
    if (step === 'signing') {
      if (signingStep === 'league') return [a, 'From which league?']
      if (signingStep === 'role') return [a, 'Which position?']
      if (signingStep === 'player') return [a, 'The signing you dream of']
      if (signingStep === 'replace') return [a, 'Who makes way?']
    }
    return ['Deadline Day', 'January window']
  }

  const getResultLabel = () => {
    if (!result) return null
    if (step === 'yesno') return result.value ? 'YES, let\'s sign!' : 'No, we stay as we are'
    if (step === 'budget') return `${result.label} available`
    if (step === 'count') return `${result.value} signing${result.value === 1 ? '' : 's'}`
    if (step === 'signing') {
      if (signingStep === 'league') return result.name
      if (signingStep === 'role') return ROLE_LABELS[result.value] || result.label
      if (signingStep === 'player') return `${result.name} · OVR ${result.rating}`
      if (signingStep === 'replace') return `Out: ${result.name}`
    }
    return null
  }

  const getResultSub = () => {
    if (!result) return 'pending'
    if (step === 'signing' && signingStep === 'player') return `OVR ${result.rating}`
    if (step === 'signing' && signingStep === 'replace') return 'leaving squad'
    return 'selected'
  }

  if (!guardPassed || loading) {
    return <div className="mister-loading"><div>Loading...</div></div>
  }

  const showNext = result && !pendingSigningStep && !pendingTransfer

  /* ---- MERCATO CHIUSO summary ---- */
  if (step === 'summary') {
    return (
      <div className="mister-page mkt fade-key">
        <DeadlineBar heading="Deadline Day · Gennaio" />
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
          <button className="btn primary" onClick={() => navigate(`/squad/${sessionId}${isAutoMode ? '?mode=auto' : ''}`)}>
            Back to squad ▸
          </button>
        </div>
        <NewsTicker />
      </div>
    )
  }

  /* ---- BREAKING NEWS confirm ---- */
  if (pendingTransfer) {
    const delta = (pendingTransfer.in.rating || 0) - (pendingTransfer.out.rating || 0)
    return (
      <div className="mister-page mkt fade-key">
        <DeadlineBar heading="Deadline Day · Gennaio" />
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
            <button className="btn dark" style={{ flex: '0 0 40%' }} disabled={saving} onClick={skipToNextSigning}>
              Skip this deal
            </button>
            <button className="btn primary" style={{ flex: 1 }} disabled={saving} onClick={executeTransfer}>
              {saving ? '...' : 'Sign the contract ▸'}
            </button>
          </div>
        </div>
        <NewsTicker />
      </div>
    )
  }

  /* ---- WHEEL stages ---- */
  const [kick, title] = getStepPrompt()
  return (
    <div className="mister-page mkt fade-key">
      <DeadlineBar heading="Deadline Day · Gennaio" />
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
                items={getWheelItems()}
                onResult={handleResult}
                resetKey={resetKey}
              />
            </div>
          </div>
          {result && !pendingSigningStep && (
            <div className="mkt-pick">
              <b>{getResultLabel()}</b>
              <span>{getResultSub()}</span>
            </div>
          )}
        </div>

        {pendingSigningStep && (
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
          {step === 'yesno' && result && !doTransfer ? 'Close without signings ▸' : 'Confirm ▸'}
        </button>
      </div>
      <NewsTicker />
    </div>
  )
}
