import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'

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
      <div className="relative">
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10">
          <div className="w-0 h-0 border-t-[12px] border-b-[12px] border-r-[20px] border-t-transparent border-b-transparent border-r-white drop-shadow-lg" />
        </div>
        <canvas ref={canvasRef} width={320} height={320} className="rounded-full shadow-2xl shadow-green-500/10" />
      </div>
      <button
        onClick={spin}
        disabled={spinning || locked || items.length === 0}
        className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black text-lg px-10 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:scale-100"
      >
        {spinning ? 'GIRANDO...' : locked ? 'GIRATO ✓' : 'GIRA! 🎰'}
      </button>
      <p className="text-gray-600 text-xs">
        premi <kbd className="bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded text-xs">spazio</kbd> per girare
      </p>
    </div>
  )
}

const STEPS = ['league', 'budget', 'formation', 'nickname', 'players']

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

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white tracking-tight">🎰 MISTER</h1>
          <p className="text-gray-500 mt-2">
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
            <div className="inline-block bg-green-500/10 border border-green-500/30 rounded-2xl px-6 py-3">
              <div className="text-2xl font-black text-green-400">
                {step === 'league' && `${result.country} ${result.name}`}
                {step === 'budget' && `💰 ${result.label} — ${result.description}`}
                {step === 'formation' && `📋 ${result.id}`}
              </div>
            </div>
          </div>
        )}

        {result && step === 'players' && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-green-500/95 border border-green-400 rounded-2xl p-8 text-center shadow-2xl">
              <div className="text-2xl mb-1">⚽</div>
              <div className="text-white font-black text-2xl mb-1">{result.name}</div>
              <div className="text-white/80 text-lg">OVR {result.rating} · {result.cost}M</div>
              <div className={`text-xs font-bold mt-2 px-2 py-1 rounded inline-block ${
                result.position === 'GK' ? 'bg-yellow-500/30 text-yellow-200' :
                result.position === 'DEF' ? 'bg-blue-500/30 text-blue-200' :
                result.position === 'MID' ? 'bg-purple-500/30 text-purple-200' :
                'bg-red-500/30 text-red-200'
              }`}>{result.position}</div>
            </div>
          </div>
        )}

        {/* Step nickname */}
        {step === 'nickname' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="text-center mb-4 text-gray-400 text-sm">
                <span className="text-white font-bold">{league?.country} {league?.name}</span> ·{' '}
                <span className="text-yellow-400 font-bold">{budget?.label}</span> ·{' '}
                <span className="text-blue-400 font-bold">{formation?.id}</span>
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nome squadra..."
                maxLength={20}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors text-center text-xl font-bold"
                onKeyDown={(e) => e.key === 'Enter' && nickname.trim() && createSession()}
              />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button
              onClick={createSession}
              disabled={!nickname.trim() || loading}
              className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black text-lg px-10 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              {loading ? 'Caricamento...' : 'INIZIA A GIRARE! ⚽'}
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
                <p className="text-gray-600 text-xs text-center mb-3">oppure scegli tu</p>
                <div className="grid grid-cols-5 gap-2">
                  {LEAGUES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => handleManualLeague(l)}
                      className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-green-500 rounded-xl p-2 text-center transition-all"
                    >
                      <div className="text-xl">{l.country}</div>
                      <div className="text-gray-400 text-xs mt-1">{l.code}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rosa accumulata */}
            {step === 'players' && squad.length > 0 && (
              <div className="w-full bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  Rosa ({squad.length}/{Object.values(slots).reduce((a, b) => a + b, 0)})
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {squad.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        p.position === 'GK' ? 'bg-yellow-500/20 text-yellow-400' :
                        p.position === 'DEF' ? 'bg-blue-500/20 text-blue-400' :
                        p.position === 'MID' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{p.position}</span>
                      <span className="text-white truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottone avanti */}
            {result && step !== 'players' && (
              <button
                onClick={nextStep}
                className="bg-white hover:bg-gray-100 text-black font-black text-lg px-10 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
              >
                AVANTI →
              </button>
            )}
          </div>
        )}

        {loading && step === 'players' && (
          <div className="text-center text-gray-400 mt-4">Salvataggio rosa in corso...</div>
        )}
      </div>
    </div>
  )
}