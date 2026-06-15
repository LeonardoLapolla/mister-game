import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'

const BUDGETS = [
  { value: 30, label: '30M', color: '#ef4444', description: 'Max score' },
  { value: 50, label: '50M', color: '#f59e0b', description: 'Balanced' },
  { value: 80, label: '80M', color: '#3b82f6', description: 'Challenging' },
  { value: 100, label: '100M', color: '#22c55e', description: 'Base score' },
]

const FORMATIONS = [
  { id: '4-3-3', slots: { GK: 1, DEF: 4, MID: 3, ATT: 3 }, color: '#16C784' },
  { id: '4-4-2', slots: { GK: 1, DEF: 4, MID: 4, ATT: 2 }, color: '#F97316' },
  { id: '3-5-2', slots: { GK: 1, DEF: 3, MID: 5, ATT: 2 }, color: '#8B5CF6' },
  { id: '5-3-2', slots: { GK: 1, DEF: 5, MID: 3, ATT: 2 }, color: '#EF4444' },
  { id: '4-2-3-1', slots: { GK: 1, DEF: 4, MID: 5, ATT: 1 }, color: '#F59E0B' },
]

const LEAGUES = [
  { code: 'PL', name: 'Premier League', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#6D28D9' },
  { code: 'SA', name: 'Serie A', country: '🇮🇹', color: '#1D4ED8' },
  { code: 'BL', name: 'Bundesliga', country: '🇩🇪', color: '#DC2626' },
  { code: 'LL', name: 'La Liga', country: '🇪🇸', color: '#EA580C' },
  { code: 'L1', name: 'Ligue 1', country: '🇫🇷', color: '#0EA5E9' },
]

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'ATT']
const POSITION_LABELS = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', ATT: 'Forwards' }

const BUDGET_FILTERS = {
  100: (p) => p.rating >= 78,
  80: (p) => p.rating >= 76 && p.rating <= 86,
  50: (p) => p.rating >= 75 && p.rating <= 84,
  30: (p) => p.rating <= 78,
}

const SEG_COLORS = [
  '#16C784','#F97316','#8B5CF6','#EF4444','#0EA5E9',
  '#F59E0B','#6D28D9','#DC2626','#1D4ED8','#EA580C',
  '#059669','#D97706','#7C3AED','#B91C1C','#0284C7',
]

function SpinWheel({ items, onResult, locked, onLock }) {
  const canvasRef = useRef(null)
  const angleRef = useRef(0)
  const rafRef = useRef(null)
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    drawWheel(angleRef.current)
  }, [items])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); spin() }
    }
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

    // glow shadow
    ctx.save()
    ctx.shadowColor = 'rgba(22,199,132,.35)'
    ctx.shadowBlur = 28
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, 2 * Math.PI)
    ctx.fillStyle = 'transparent'
    ctx.fill()
    ctx.restore()

    const arc = (2 * Math.PI) / items.length

    items.forEach((item, i) => {
      const start = angle + i * arc
      const end = start + arc
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, R, start, end)
      ctx.closePath()
      ctx.fillStyle = item.color || SEG_COLORS[i % SEG_COLORS.length]
      ctx.fill()
      ctx.strokeStyle = 'rgba(4,7,10,.6)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + arc / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.font = `bold ${items.length > 10 ? '9' : '12'}px 'Saira Condensed', monospace`
      const label = item.label || item.name || item.id || String(item)
      const truncated = label.length > 14 ? label.slice(0, 13) + '…' : label
      ctx.fillText(truncated, R - 8, 4)
      ctx.restore()
    })

    // center hub
    ctx.beginPath()
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI)
    const grad = ctx.createRadialGradient(cx, cy - 4, 0, cx, cy, 20)
    grad.addColorStop(0, '#5BE3B0')
    grad.addColorStop(1, '#0FA56C')
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.35)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  function getResult(angle) {
    const arc = (2 * Math.PI) / items.length
    const normalized = (((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))
    const index = Math.floor(normalized / arc) % items.length
    return items[index]
  }

  function spin() {
    if (spinning || locked || items.length === 0) return
    onLock()
    setSpinning(true)

    const totalRotation = (10 + Math.random() * 10) * 2 * Math.PI
    const duration = 3000 + Math.random() * 1500
    const start = performance.now()
    const startAngle = angleRef.current

    function animate(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 4)
      angleRef.current = startAngle + totalRotation * ease
      drawWheel(angleRef.current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        onResult(getResult(angleRef.current))
      }
    }
    rafRef.current = requestAnimationFrame(animate)
  }

  function skipSpin() {
    if (!spinning) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setSpinning(false)
    onResult(getResult(angleRef.current))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative' }}>
        {/* pointer */}
        <div style={{
          position: 'absolute', top: '50%', right: -14, transform: 'translateY(-50%)',
          zIndex: 10, width: 0, height: 0,
          borderTop: '11px solid transparent', borderBottom: '11px solid transparent',
          borderRight: '18px solid #fff',
          filter: 'drop-shadow(0 0 8px rgba(22,199,132,.7))'
        }} />
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          style={{ borderRadius: '50%', display: 'block', cursor: locked ? 'default' : 'pointer' }}
          onClick={() => spinning ? skipSpin() : spin()}
        />
      </div>
      <button
        onClick={spin}
        disabled={spinning || locked || items.length === 0}
        className="btn primary btn-sm"
        style={{ opacity: (spinning || locked || items.length === 0) ? 0.45 : 1, width: 'auto', minWidth: 140 }}
      >
        {spinning ? 'SPINNING...' : locked ? 'SPUN ✓' : 'SPIN!'}
      </button>
    </div>
  )
}

const STEPS = ['league', 'budget', 'formation', 'nickname', 'players']
const STEP_LABELS = {
  league: 'League',
  budget: 'Budget',
  formation: 'Formation',
  nickname: 'Team name',
  players: 'Players',
}

export default function Wheel() {
  const navigate = useNavigate()
  const { setSession } = useGameStore()

  const [step, setStep] = useState('league')
  const [locked, setLocked] = useState(false)
  const [result, setResult] = useState(null)

  const [league, setLeague] = useState(null)
  const [budget, setBudget] = useState(null)
  const [formation, setFormation] = useState(null)
  const [nickname, setNickname] = useState('')
  const [sessionId, setSessionId] = useState(null)

  const [allPlayers, setAllPlayers] = useState([])
  const [squad, setSquad] = useState([])
  const [currentPosition, setCurrentPosition] = useState(null)
  const [wheelPlayers, setWheelPlayers] = useState([])
  const [playerLocked, setPlayerLocked] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getWheelItems = () => {
    if (step === 'league')    return LEAGUES.map(l => ({ ...l, label: l.name }))
    if (step === 'budget')    return BUDGETS.map(b => ({ ...b, label: b.label }))
    if (step === 'formation') return FORMATIONS.map(f => ({ ...f, label: f.id }))
    if (step === 'players')   return wheelPlayers.map(p => ({ ...p, label: p.name }))
    return []
  }

  const handleLeagueResult = (item) => { setResult(item); setLeague(item) }
  const handleBudgetResult = (item) => { setResult(item); setBudget(item) }
  const handleFormationResult = (item) => { setResult(item); setFormation(item) }

  const handleManualLeague = (l) => {
    setLeague(l)
    setResult(l)
    setLocked(true)
  }

  const handlePlayerResult = (player) => {
    setResult(player)
    setPlayerLocked(true)

    const newSquad = [...squad, { ...player, position: currentPosition }]
    setSquad(newSquad)
    setWheelPlayers(prev => prev.filter(p => p.name !== player.name))

    const slots = formation.slots
    const playersInPosition = newSquad.filter(p => p.position === currentPosition).length

    if (playersInPosition >= slots[currentPosition]) {
      const posIndex = POSITION_ORDER.indexOf(currentPosition)
      const nextPos = POSITION_ORDER[posIndex + 1]

      if (nextPos) {
        setTimeout(() => {
          setCurrentPosition(nextPos)
          setResult(null)
          setPlayerLocked(false)
          setupWheelForPosition(nextPos, newSquad)
        }, 1500)
      } else {
        setTimeout(() => saveSquad(newSquad), 1500)
      }
    } else {
      setTimeout(() => {
        setResult(null)
        setPlayerLocked(false)
      }, 1500)
    }
  }

  const setupWheelForPosition = (position, currentSquad = squad) => {
    const filter = BUDGET_FILTERS[budget?.value] || (() => true)
    const squadNames = currentSquad.map(p => p.name)
    const available = allPlayers
      .filter(p => p.position === position)
      .filter(p => filter(p))
      .filter(p => !squadNames.includes(p.name))
    setWheelPlayers(available)
  }

  const createSession = async () => {
    if (!nickname.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          league: league.code,
          budget: budget.value,
          formation: formation.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSession(data.session)
      setSessionId(data.session.id)

      const mRes = await fetch(`/api/market/${data.session.id}`)
      const mData = await mRes.json()
      setAllPlayers(mData.players)

      const firstPos = 'GK'
      setCurrentPosition(firstPos)
      const filter = BUDGET_FILTERS[budget.value] || (() => true)
      const available = mData.players.filter(p => p.position === firstPos).filter(filter)
      setWheelPlayers(available)
      setStep('players')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveSquad = async (finalSquad) => {
    setLoading(true)
    try {
      for (const player of finalSquad) {
        const res = await fetch(`/api/market/${sessionId}/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName: player.name }),
        })
        const data = await res.json()
        if (!res.ok) console.error(`Errore acquisto ${player.name}:`, data.error)
        await new Promise(r => setTimeout(r, 100))
      }
      navigate(`/squad/${sessionId}`)
    } catch (err) {
      setError('Error saving squad')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    const idx = STEPS.indexOf(step)
    setResult(null)
    setLocked(false)
    setStep(STEPS[idx + 1])
  }

  const slots = formation?.slots || {}
  const currentPositionSlots = slots[currentPosition] || 0
  const currentPositionCount = squad.filter(p => p.position === currentPosition).length
  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="mister-page">
      {/* Steps indicator */}
      <div className="steps" style={{ paddingTop: 18 }}>
        {STEPS.map((s, i) => (
          <i key={s} className={i < stepIdx ? 'done' : i === stepIdx ? 'now' : ''} />
        ))}
      </div>

      {/* Header */}
      <div className="setup-prompt">
        <div className="lbl">{STEP_LABELS[step]}</div>
        <h2>
          {step === 'league' && 'Choose your league'}
          {step === 'budget' && 'Available budget'}
          {step === 'formation' && 'Formation'}
          {step === 'nickname' && 'Team name'}
          {step === 'players' && `${POSITION_LABELS[currentPosition]} — ${currentPositionCount}/${currentPositionSlots}`}
        </h2>
      </div>

      {/* NICKNAME STEP */}
      {step === 'nickname' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 22px 0', gap: 14 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-num)', fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginBottom: 12 }}>
              {league?.country} {league?.name} · {budget?.label} · {formation?.id}
            </div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Team name..."
              maxLength={20}
              className="name-input"
              style={{ textAlign: 'center' }}
              onKeyDown={(e) => e.key === 'Enter' && nickname.trim() && createSession()}
            />
          </div>
          {error && <div style={{ color: 'var(--loss)', fontSize: 13, textAlign: 'center' }}>{error}</div>}
          <div style={{ flex: 1 }} />
          <div className="screen-foot" style={{ padding: 0 }}>
            <button
              onClick={createSession}
              disabled={!nickname.trim() || loading}
              className="btn primary"
              style={{ opacity: (!nickname.trim() || loading) ? 0.4 : 1 }}
            >
              {loading ? 'Loading...' : 'START SPINNING ▶'}
            </button>
          </div>
        </div>
      )}

      {/* WHEEL STEPS */}
      {step !== 'nickname' && (
        <>
          <div className="page-scroll" style={{ flex: 1 }}>
            <div className="wheelwrap">
              <SpinWheel
                items={getWheelItems()}
                onResult={
                  step === 'league' ? handleLeagueResult :
                  step === 'budget' ? handleBudgetResult :
                  step === 'formation' ? handleFormationResult :
                  handlePlayerResult
                }
                locked={step === 'players' ? playerLocked : locked}
                onLock={() => step === 'players' ? setPlayerLocked(true) : setLocked(true)}
              />
            </div>

            {/* Result tag */}
            {result && step !== 'players' && (
              <div className="result-tag">
                <b>
                  {step === 'league' && result.name}
                  {step === 'budget' && result.label}
                  {step === 'formation' && result.id}
                </b>
                <span>
                  {step === 'budget' && result.description}
                  {step === 'formation' && 'Formation'}
                  {step === 'league' && 'League'}
                </span>
              </div>
            )}

            {result && step === 'players' && (
              <div className="result-tag">
                <b>{result.name}</b>
                <span>OVR {result.rating}</span>
              </div>
            )}

            {/* Manual league choice */}
            {step === 'league' && !locked && (
              <div style={{ padding: '16px 22px 0' }}>
                <div className="section-title" style={{ paddingLeft: 0 }}>or choose yourself</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {LEAGUES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => handleManualLeague(l)}
                      className="opt"
                      style={{ flex: 1, padding: '8px 4px', textAlign: 'center', minWidth: 0 }}
                    >
                      <b style={{ fontSize: 13 }}>{l.name}</b>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Accumulated squad */}
            {step === 'players' && squad.length > 0 && (
              <div style={{ padding: '16px 22px 0' }}>
                <div className="section-title" style={{ paddingLeft: 0 }}>
                  Squad ({squad.length}/{Object.values(slots).reduce((a, b) => a + b, 0)})
                </div>
                <div className="roster" style={{ padding: 0 }}>
                  {squad.map((p, i) => (
                    <div key={i} className="rrow">
                      <span className="rrole">{p.position}</span>
                      <span className="rnm">{p.name}</span>
                      <span className="rovr" style={{ color: 'var(--primary)' }}>{p.rating}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && step === 'players' && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '12px 0', fontFamily: 'var(--font-num)', fontSize: 12 }}>
                Saving squad...
              </div>
            )}
          </div>

          {/* CTA */}
          {result && step !== 'players' && (
            <div className="screen-foot">
              <button onClick={nextStep} className="btn primary">
                {step === 'formation' ? 'CHOOSE YOUR NAME ▶' : 'NEXT ▶'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
