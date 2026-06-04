import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import { IconSlot, IconMoney, IconClipboard, IconBall } from '../components/Icons'
import useBlockBack from '../hooks/useBlockBack'
import useGameRedirect from '../hooks/useGameRedirect'


const BUDGETS = [
  { value: 30, label: '30M', color: '#ef4444', description: 'Massimo punteggio' },
  { value: 50, label: '50M', color: '#f59e0b', description: 'Equilibrato' },
  { value: 80, label: '80M', color: '#3b82f6', description: 'Sfidante' },
  { value: 100, label: '100M', color: '#22c55e', description: 'Punteggio base' },
]

const FORMATIONS = [
  { id: '4-3-3', slots: { GK: 1, DEF: 4, MID: 3, ATT: 3 } },
  { id: '4-4-2', slots: { GK: 1, DEF: 4, MID: 4, ATT: 2 } },
  { id: '3-5-2', slots: { GK: 1, DEF: 3, MID: 5, ATT: 2 } },
  { id: '5-3-2', slots: { GK: 1, DEF: 5, MID: 3, ATT: 2 } },
  { id: '4-2-3-1', slots: { GK: 1, DEF: 4, MID: 5, ATT: 1 } },
]

const LEAGUES = [
  { code: 'PL', name: 'Premier League', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'SA', name: 'Serie A', country: '🇮🇹' },
  { code: 'BL', name: 'Bundesliga', country: '🇩🇪' },
  { code: 'LL', name: 'La Liga', country: '🇪🇸' },
  { code: 'L1', name: 'Ligue 1', country: '🇫🇷' },
]

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'ATT']
const POSITION_LABELS = { GK: 'Portieri', DEF: 'Difensori', MID: 'Centrocampisti', ATT: 'Attaccanti' }

const BUDGET_FILTERS = {
  100: (p) => p.rating >= 78,
  80: (p) => p.rating >= 76 && p.rating <= 86,
  50: (p) => p.rating >= 75 && p.rating <= 84,
  30: (p) => p.rating <= 78,
}

function SpinWheel({ items, onResult, locked, onLock }) {
  const canvasRef = useRef(null)
  const angleRef = useRef(0)
  const rafRef = useRef(null)
  const [spinning, setSpinning] = useState(false)

  const colors = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#ec4899', '#10b981', '#6366f1',
    '#14b8a6', '#f43f5e', '#84cc16', '#0ea5e9', '#a855f7',
  ]

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
    const arc = (2 * Math.PI) / items.length

    items.forEach((item, i) => {
      const start = angle + i * arc
      const end = start + arc
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, R, start, end)
      ctx.closePath()
      ctx.fillStyle = colors[i % colors.length]
      ctx.fill()
      ctx.strokeStyle = '#111827'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + arc / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${items.length > 10 ? '9' : '12'}px monospace`
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 4
      const label = item.label || item.name || item.id || String(item)
      const truncated = label.length > 14 ? label.slice(0, 13) + '…' : label
      ctx.fillText(truncated, R - 8, 4)
      ctx.restore()
    })

    ctx.beginPath()
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
    ctx.fillStyle = '#111827'
    ctx.fill()
    ctx.strokeStyle = '#4b5563'
    ctx.lineWidth = 2
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

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`relative rounded-full p-1 ${spinning ? 'animate-pulse-glow' : ''}`}
        style={{ border: '1px solid rgba(0,230,118,0.25)' }}>
        <div className="absolute top-1/2 -right-5 -translate-y-1/2 z-10">
          <div className="w-0 h-0 border-t-[12px] border-b-[12px] border-r-[20px] border-t-transparent border-b-transparent drop-shadow-lg"
            style={{ borderRightColor: 'var(--c-green)' }} />
        </div>
        <canvas ref={canvasRef} width={320} height={320} className="rounded-full"
          style={{ boxShadow: '0 0 40px rgba(0,230,118,0.1)' }} />
      </div>
      <button
        onClick={spin}
        disabled={spinning || locked || items.length === 0}
        className="btn-primary text-lg px-10 py-3 disabled:opacity-40"
        style={{ fontWeight: 800 }}
      >
        {spinning ? 'GIRANDO...' : locked ? 'GIRATO ✓' : 'GIRA!'}
      </button>
      <p className="text-xs" style={{ color: 'var(--c-faint)' }}>
        premi <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--c-surface2)', color: 'var(--c-muted)' }}>spazio</kbd> per girare
      </p>
    </div>
  )
}

const STEPS = ['league', 'budget', 'formation', 'nickname', 'players']

export default function Wheel() {
  useBlockBack()
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
    if (step === 'league') return LEAGUES.map(l => ({ ...l, label: l.country + ' ' + l.name }))
    if (step === 'budget') return BUDGETS.map(b => ({ ...b, label: b.label }))
    if (step === 'formation') return FORMATIONS.map(f => ({ ...f, label: f.id }))
    if (step === 'players') return wheelPlayers.map(p => ({ ...p, label: p.name }))
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
      setError('Errore nel salvataggio della rosa')
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

  const posBadgeStyle = (pos) => {
    if (pos === 'GK') return { bg: 'rgba(255,171,0,0.15)', color: 'var(--c-amber)' }
    if (pos === 'DEF') return { bg: 'rgba(68,138,255,0.15)', color: 'var(--c-blue)' }
    if (pos === 'MID') return { bg: 'rgba(0,230,118,0.15)', color: 'var(--c-green)' }
    return { bg: 'rgba(255,61,87,0.15)', color: 'var(--c-red)' }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: 'var(--c-bg)' }}>
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <h1 className="section-title flex items-center justify-center gap-3" style={{ fontSize: 'clamp(2.5rem,10vw,4rem)' }}>
            <IconSlot size={36} style={{ color: 'var(--c-green)' }} /> MISTER
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--c-muted)' }}>
            {step === 'league' && 'Gira per un campionato casuale o scegli tu'}
            {step === 'budget' && 'Gira per scoprire il tuo budget'}
            {step === 'formation' && 'Gira per ottenere il modulo'}
            {step === 'nickname' && 'Come si chiama la tua squadra?'}
            {step === 'players' && `${POSITION_LABELS[currentPosition]} — ${currentPositionCount}/${currentPositionSlots}`}
          </p>
        </div>

        {/* Risultato corrente */}
        {result && step !== 'players' && (
          <div className="text-center mb-6">
            <div className="inline-block rounded-2xl px-6 py-3"
              style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)' }}>
              <div className="flex items-center gap-2 text-2xl font-black" style={{ color: 'var(--c-green)' }}>
                {step === 'league' && `${result.country} ${result.name}`}
                {step === 'budget' && <><IconMoney size={22} />{result.label} — {result.description}</>}
                {step === 'formation' && <><IconClipboard size={22} />{result.id}</>}
              </div>
            </div>
          </div>
        )}

        {result && step === 'players' && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="rounded-2xl p-8 text-center shadow-2xl"
              style={{ background: 'rgba(0,230,118,0.95)', border: '1px solid var(--c-green)' }}>
              <div className="flex justify-center mb-1"><IconBall size={32} /></div>
              <div className="font-black text-2xl mb-1 text-black">{result.name}</div>
              <div className="text-black/80 text-lg" style={{ fontFamily: 'DM Mono, monospace' }}>
                OVR {result.rating} · {result.cost}M
              </div>
              <div className="text-xs font-bold mt-2 px-2 py-1 rounded inline-block text-black/70">
                {result.position}
              </div>
            </div>
          </div>
        )}

        {/* Step nickname */}
        {step === 'nickname' && (
          <div className="flex flex-col items-center gap-4">
            <div className="card-base w-full p-6">
              <div className="text-center mb-4 text-sm" style={{ color: 'var(--c-muted)' }}>
                <span style={{ color: 'var(--c-text)', fontWeight: 600 }}>{league?.country} {league?.name}</span> ·{' '}
                <span style={{ color: 'var(--c-amber)', fontWeight: 600 }}>{budget?.label}</span> ·{' '}
                <span style={{ color: 'var(--c-blue)', fontWeight: 600 }}>{formation?.id}</span>
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nome squadra..."
                maxLength={20}
                className="w-full rounded-xl px-4 py-3 text-center text-xl font-bold transition-colors focus:outline-none"
                style={{
                  background: 'var(--c-surface2)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--c-green)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--c-border)'}
                onKeyDown={(e) => e.key === 'Enter' && nickname.trim() && createSession()}
              />
            </div>
            {error && <div className="text-sm" style={{ color: 'var(--c-red)' }}>{error}</div>}
            <button
              onClick={createSession}
              disabled={!nickname.trim() || loading}
              className="btn-primary text-lg px-10 py-3 disabled:opacity-40"
              style={{ fontWeight: 800 }}
            >
              {loading ? 'Caricamento...' : <><IconBall size={18} /> INIZIA A GIRARE!</>}
            </button>
          </div>
        )}

        {/* Ruota */}
        {step !== 'nickname' && (
          <div className="flex flex-col items-center gap-6">
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

            {/* Scelta manuale campionato */}
            {step === 'league' && !locked && (
              <div className="w-full">
                <p className="text-xs text-center mb-3" style={{ color: 'var(--c-faint)' }}>oppure scegli tu</p>
                <div className="grid grid-cols-5 gap-2">
                  {LEAGUES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => handleManualLeague(l)}
                      className="card-base card-glow-green p-2 text-center transition-all"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="text-xl">{l.country}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>{l.code}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rosa accumulata */}
            {step === 'players' && squad.length > 0 && (
              <div className="card-base w-full p-4">
                <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>
                  Rosa ({squad.length}/{Object.values(slots).reduce((a, b) => a + b, 0)})
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {squad.map((p, i) => {
                    const s = posBadgeStyle(p.position)
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>{p.position}</span>
                        <span className="truncate" style={{ color: 'var(--c-text)' }}>{p.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bottone avanti */}
            {result && step !== 'players' && (
              <button onClick={nextStep} className="btn-ghost text-lg px-10 py-3" style={{ fontWeight: 700 }}>
                AVANTI →
              </button>
            )}
          </div>
        )}

        {loading && step === 'players' && (
          <div className="text-center mt-4 text-sm animate-pulse" style={{ color: 'var(--c-muted)' }}>
            Salvataggio rosa in corso...
          </div>
        )}
      </div>
    </div>
  )
}